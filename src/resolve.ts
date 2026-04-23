import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import * as readline from "node:readline/promises";
import { stdin as stdinStream, stdout as output } from "node:process";
import { comparePlanBuild, planBuildForDisplay } from "./compare.js";
import { formatLineDiff } from "./diff-preview.js";
import { bold, diffLegend, dim, hr, sectionTitle } from "./terminal-ui.js";
import { readPlan } from "./plan-reader.js";
import { presentAligned, presentInsufficient, presentMismatch } from "./present.js";
import type { BuildSignals, CompareResult, PlanSignals } from "./types.js";
import { suggestBuildFromOpenAI } from "./openai-build-draft.js";
import { buildFixPrompt, rewritePlanToMatchBuild } from "./rewrite-plan.js";

export type ResolutionChoice = "update_plan" | "build_prompt" | "defer";

/** When stdin is not a TTY and no resolution was provided via env/flag. */
export type ResolutionPromptOutcome =
  | { kind: "chosen"; choice: ResolutionChoice }
  | { kind: "noninteractive" };

export type ApplyOptions = {
  /** When false, skip review / re-check (automation or non-TTY). */
  interactive: boolean;
};

function parseChoiceToken(raw: string): ResolutionChoice | null {
  const a = raw.trim().toLowerCase();
  if (a === "1" || a === "update" || a === "update plan") return "update_plan";
  if (a === "2" || a === "prompt" || a === "fix" || a === "generate build-fix prompt") {
    return "build_prompt";
  }
  if (a === "3" || a === "later" || a === "skip" || a === "decide later") return "defer";
  return null;
}

export function resolutionFromEnv(): ResolutionChoice | null {
  const env = process.env.INTENT_MERGE_RESOLUTION?.trim();
  return parseChoiceToken(env ?? "");
}

async function withRl<T>(fn: (rl: readline.Interface) => Promise<T>): Promise<T> {
  const rl = readline.createInterface({ input: stdinStream, output });
  try {
    return await fn(rl);
  } finally {
    rl.close();
  }
}

async function confirmYesNo(message: string, defaultYes: boolean): Promise<boolean> {
  if (!stdinStream.isTTY) return defaultYes;
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  return withRl(async (rl) => {
    const raw = (await rl.question(`${message} ${hint} `)).trim().toLowerCase();
    if (!raw) return defaultYes;
    return raw === "y" || raw === "yes";
  });
}

export async function promptResolution(): Promise<ResolutionPromptOutcome> {
  const fromEnv = resolutionFromEnv();
  if (fromEnv) return { kind: "chosen", choice: fromEnv };

  if (!stdinStream.isTTY) {
    return { kind: "noninteractive" };
  }

  const line = hr();
  const banner =
    `\n${line}\n` +
    `${bold("Next step")}\n` +
    `${dim("Type a number, then Enter (while this program is running — not at the shell prompt after it exits).")}\n\n` +
    `  ${bold("1")}  Update plan\n` +
    `  ${bold("2")}  Generate build-fix prompt\n` +
    `  ${bold("3")}  Decide later\n` +
    `${line}\n`;

  await output.write(banner);

  const rl = readline.createInterface({ input: stdinStream, output });
  try {
    for (;;) {
      const answer = (await rl.question("Your choice (1 / 2 / 3): ")).trim();
      const choice = parseChoiceToken(answer);
      if (choice) return { kind: "chosen", choice };
      await output.write(
        "That did not match 1, 2, or 3. Try again (only the digit is needed, then Enter).\n",
      );
    }
  } finally {
    rl.close();
  }
}

async function ensureStagingDir(planPath: string): Promise<string> {
  const dir = path.join(path.dirname(planPath), ".intent-merge");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === "darwin") {
      execFileSync("pbcopy", { input: text });
      return true;
    }
    if (process.platform === "win32") {
      execFileSync("clip", { input: text, windowsHide: true });
      return true;
    }
    execFileSync("xclip", ["-selection", "clipboard"], { input: text });
    return true;
  } catch {
    return false;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

async function openInEditor(filePath: string): Promise<void> {
  if (process.platform === "win32") {
    const cmd = process.env.VISUAL || process.env.EDITOR || "notepad";
    await new Promise<void>((resolve, reject) => {
      const child = spawn(cmd, [filePath], { stdio: "inherit" });
      child.on("close", () => resolve());
      child.on("error", reject);
    });
    return;
  }
  const cmd = process.env.VISUAL || process.env.EDITOR;
  const inner = cmd ? `${cmd} ${shellQuote(filePath)}` : `vi ${shellQuote(filePath)}`;
  await new Promise<void>((resolve, reject) => {
    const child = spawn("/bin/sh", ["-c", inner], { stdio: "inherit" });
    child.on("close", () => resolve());
    child.on("error", reject);
  });
}

async function recheckAlignment(
  planPath: string,
  buildPath: string,
  originalBuildSource: string,
  showSinceStartDiff: boolean,
): Promise<void> {
  let newBuild: string;
  try {
    newBuild = await fs.readFile(buildPath, "utf8");
  } catch (e) {
    console.error("\nCould not read build file:", (e as Error).message);
    return;
  }

  if (showSinceStartDiff) {
    if (newBuild !== originalBuildSource) {
      console.log(sectionTitle("Build — what changed since this check started"));
      console.log(diffLegend("build when this check started", "build file on disk now"));
      console.log(
        formatLineDiff(originalBuildSource, newBuild, {
          beforeLabel: "at check start",
          afterLabel: "on disk now",
        }),
      );
    } else {
      console.log(dim("\n(no edits to the build file since this check started)\n"));
    }
  }

  const planMd = await fs.readFile(planPath, "utf8");
  const again = comparePlanBuild(planMd, newBuild);
  console.log(sectionTitle("Alignment after your changes"));
  if (again.kind === "aligned") {
    console.log(presentAligned(readPlan(planMd).title, { compact: true }));
  } else if (again.kind === "insufficient_signal") {
    console.log(presentInsufficient(readPlan(planMd).title, again.confidenceNote, { compact: true }));
  } else {
    try {
      const fresh = planBuildForDisplay(planMd, newBuild);
      console.log(presentMismatch(fresh.plan, fresh.build, again, { compact: true }));
    } catch {
      console.log("Could not re-display mismatch details; run check again.");
    }
  }
}

async function maybeRunHook(promptFile: string, planPath: string, buildPath: string): Promise<void> {
  const hook = process.env.INTENT_MERGE_HOOK?.trim();
  if (!hook) return;
  const ok = await confirmYesNo(`Run INTENT_MERGE_HOOK now?\n  ${hook}`, false);
  if (!ok) return;

  const env = {
    ...process.env,
    INTENT_MERGE_PROMPT_FILE: promptFile,
    INTENT_MERGE_PLAN_FILE: path.resolve(planPath),
    INTENT_MERGE_BUILD_FILE: path.resolve(buildPath),
  };
  const shell = process.env.SHELL || (process.platform === "win32" ? undefined : "/bin/sh");
  await new Promise<void>((resolve, reject) => {
    if (process.platform === "win32" && !shell) {
      const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", hook], {
        stdio: "inherit",
        env,
        windowsHide: true,
      });
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`hook exited ${code}`))));
      child.on("error", reject);
      return;
    }
    const child = spawn(shell!, ["-lc", hook], { stdio: "inherit", env });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`hook exited ${code}`))));
    child.on("error", reject);
  });
}

export async function applyResolution(
  choice: ResolutionChoice,
  planPath: string,
  buildPath: string,
  originalPlanMd: string,
  originalBuildSource: string,
  plan: PlanSignals,
  build: BuildSignals,
  compare: CompareResult,
  options: ApplyOptions,
): Promise<void> {
  const { interactive } = options;

  if (choice === "defer") {
    console.log(sectionTitle("No changes (for now)"));
    console.log(
      dim("Alignment is still unresolved. Run the same check again when you want to revisit it.\n"),
    );
    return;
  }

  if (choice === "update_plan") {
    const next = rewritePlanToMatchBuild(originalPlanMd, plan, build);
    if (interactive) {
      console.log(sectionTitle("Plan update — preview diff"));
      console.log(diffLegend("current plan on disk", "proposed plan"));
      console.log(
        formatLineDiff(originalPlanMd, next, { beforeLabel: "current plan", afterLabel: "proposed" }),
      );
      const apply = await confirmYesNo("\nWrite this to the plan file?", true);
      if (!apply) {
        console.log(dim("\nSkipped — plan file was not modified.\n"));
        return;
      }
    }
    await fs.writeFile(planPath, next, "utf8");
    console.log(`\n${bold("Plan file updated")}`);
    console.log(dim(path.resolve(planPath)) + "\n");
    return;
  }

  const prompt = buildFixPrompt(plan, build, compare.mismatches);
  const staging = await ensureStagingDir(planPath);
  const promptFile = path.join(staging, "build-fix.prompt.md");
  await fs.writeFile(promptFile, prompt, "utf8");

  console.log(sectionTitle("Build-fix prompt (copy or use with your agent)"));
  console.log(prompt);
  console.log(dim(`\nSaved to: ${promptFile}\n`));

  const copied = copyToClipboard(prompt);
  if (copied) {
    console.log(dim("\n(Also copied to your clipboard where supported.)"));
  }

  if (!interactive) {
    console.log(
      dim(
        "\nRe-run the same check after your agent updates the build file to see the new alignment result.\n",
      ),
    );
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  let appliedAiDraft = false;

  if (apiKey) {
    const wantAi = await confirmYesNo(
      "\nGenerate an AI draft of the updated build file (OpenAI)? You can edit it before applying.",
      true,
    );
    if (wantAi) {
      try {
        const draft = await suggestBuildFromOpenAI({
          apiKey,
          planMarkdown: originalPlanMd,
          buildPath,
          buildSource: originalBuildSource,
          buildFixPrompt: prompt,
        });
        const ext = path.extname(buildPath) || ".ts";
        const proposedPath = path.join(staging, `build.proposed${ext}`);
        await fs.writeFile(proposedPath, draft, "utf8");
        console.log(sectionTitle("AI draft vs your current build"));
        console.log(dim(`Draft file (edit before applying): ${proposedPath}`));
        console.log(diffLegend("current build file", "AI draft"));
        console.log(
          formatLineDiff(originalBuildSource, draft, { beforeLabel: "current build", afterLabel: "AI draft" }),
        );

        const openEd = await confirmYesNo("\nOpen the draft in your editor to revise?", true);
        if (openEd) {
          console.log("\n(Closing the editor returns you here.)\n");
          await openInEditor(proposedPath);
        }

        const revised = await fs.readFile(proposedPath, "utf8");
        if (revised !== draft) {
          console.log(sectionTitle("Draft after your edits"));
          console.log(diffLegend("original build (at check start)", "your edited draft"));
          console.log(
            formatLineDiff(originalBuildSource, revised, {
              beforeLabel: "original build",
              afterLabel: "your draft",
            }),
          );
        }

        const rel = path.relative(process.cwd(), buildPath) || buildPath;
        const apply = await confirmYesNo(`\nApply this draft to ${rel}?`, false);
        if (apply) {
          await fs.writeFile(buildPath, revised, "utf8");
          appliedAiDraft = true;
          console.log(`\n${bold("Build file updated")}`);
          console.log(dim(path.resolve(buildPath)) + "\n");
        } else {
          console.log(dim("\nNot applied. Draft kept at:\n  " + proposedPath + "\n"));
        }
      } catch (e) {
        console.error("\nOpenAI draft failed:", (e as Error).message);
        console.log("You can still use the prompt file with your agent, or try again.");
      }
    }
  } else {
    console.log(
      dim(
        "\nTip: set OPENAI_API_KEY in .env for an AI draft you can open in your editor, revise, and apply.\n",
      ),
    );
  }

  await maybeRunHook(promptFile, planPath, buildPath);

  if (appliedAiDraft) {
    await recheckAlignment(planPath, buildPath, originalBuildSource, false);
    return;
  }

  await withRl(async (rl) => {
    await output.write(
      `\nIf you are fixing the build yourself (or outside this tool), save:\n  ${path.resolve(buildPath)}\n\nPress Enter when you are ready to re-check (or type "skip"): `,
    );
    const line = (await rl.question("")).trim().toLowerCase();
    if (line === "skip") {
      console.log("\nSkipped re-check. Run intent-merge check again whenever you want.");
      return;
    }
  });

  await recheckAlignment(planPath, buildPath, originalBuildSource, true);
}
