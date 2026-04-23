import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(packageRoot, ".env") });

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { demoPaths, listDemoIds } from "./demo-fixtures.js";
import { runInit } from "./init-starter.js";
import { readPlan } from "./plan-reader.js";
import { comparePlanBuild, planBuildForDisplay } from "./compare.js";
import { presentAligned, presentInsufficient, presentMismatch } from "./present.js";
import { applyResolution, promptResolution } from "./resolve.js";
import { bold, dim } from "./terminal-ui.js";

const DEFAULT_PLANS = ["plan.md", "feature.md"];
const DEFAULT_BUILDS = ["build.ts", "index.ts"];

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function pickDefault(candidates: string[], cwd: string): Promise<string | null> {
  for (const name of candidates) {
    const full = path.join(cwd, name);
    if (await fileExists(full)) return full;
  }
  return null;
}

async function askPath(rl: readline.Interface, label: string): Promise<string> {
  const raw = (await rl.question(`Path to ${label}: `)).trim();
  return path.resolve(raw);
}

function normalizeArgv(argv: string[]): string[] {
  if (argv.length === 0) return ["help"];
  const c = argv[0];
  if (c === "check" || c === "init" || c === "setup" || c === "help" || c === "-h" || c === "--help") {
    return argv;
  }
  if (c === "demo") return ["check", "--demo", ...argv.slice(1)];
  if (c.endsWith(".md") || c.endsWith(".ts") || c.endsWith(".tsx") || c.endsWith(".js")) {
    return ["check", ...argv];
  }
  return argv;
}

function parseAfterCheck(rest: string[]): {
  paths: string[];
  resolutionToken?: string;
  demo?: string;
  verbose: boolean;
} {
  const paths: string[] = [];
  let resolutionToken: string | undefined;
  let demo: string | undefined;
  let verbose = false;

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--verbose" || a === "-v") {
      verbose = true;
      continue;
    }
    if (a === "--demo") {
      const next = rest[i + 1];
      if (next && !next.startsWith("-")) {
        demo = next;
        i++;
      } else {
        demo = "03";
      }
      continue;
    }
    if (a.startsWith("--demo=")) {
      demo = a.slice("--demo=".length) || "03";
      continue;
    }
    if (a === "--resolution" && rest[i + 1]) {
      resolutionToken = rest[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--resolution=")) {
      resolutionToken = a.slice("--resolution=".length);
      continue;
    }
    if (a === "-r" && rest[i + 1]) {
      resolutionToken = rest[i + 1];
      i++;
      continue;
    }
    paths.push(a);
  }
  if (paths.length >= 3 && /^[123]$/.test(paths[paths.length - 1])) {
    resolutionToken = paths.pop();
  }
  return { paths, resolutionToken, demo, verbose };
}

async function resolvePaths(pathArgs: string[], cwd: string): Promise<[string, string]> {
  if (pathArgs.length >= 2) {
    return [path.resolve(pathArgs[0]), path.resolve(pathArgs[1])];
  }
  if (pathArgs.length === 1) {
    throw new Error("Pass two paths (plan then build), or use defaults / --demo.");
  }
  const plan = await pickDefault(DEFAULT_PLANS, cwd);
  const build = await pickDefault(DEFAULT_BUILDS, cwd);
  if (!plan || !build) {
    throw new Error(
      `No markdown spec + implementation pair found in this folder yet.\n\n` +
        `Intent Merge looks for one of: ${DEFAULT_PLANS.join(", ")} with one of: ${DEFAULT_BUILDS.join(", ")}.\n\n` +
        `Try one of these:\n` +
        `  intent-merge init              create plan.md + build.ts here\n` +
        `  intent-merge check --demo      run a built-in sample (nothing to create)\n` +
        `  intent-merge setup             quick start: create files if missing + print the ritual\n\n` +
        `Or pass two paths: intent-merge check path/to/spec.md path/to/file.ts\n`,
    );
  }
  return [plan, build];
}

function printHelp(): void {
  const ids = listDemoIds().join(", ");
  console.log(`Intent Merge — keep one markdown spec and one code file in sync

${dim("Quick")}
  intent-merge check              use ./plan.md + ./build.ts when both exist
  intent-merge check --verbose    same, with technical detail (signatures, return shape)
  intent-merge check --demo       built-in sample (${dim("default: 03 missing-password")})
  intent-merge demo               same as check --demo
  intent-merge init               create plan.md + build.ts in this folder
  intent-merge setup              quick start + print the ritual (creates files if missing)

${dim("Your files")}
  intent-merge check plan.md build.ts
  intent-merge check --demo 02       sample by id: ${ids} (or folder name)

${dim("Automation")}
  intent-merge check --resolution=2 plan.md build.ts
  INTENT_MERGE_RESOLUTION=3 intent-merge check

${dim("More")}
  intent-merge help               show this message
`);
}

async function main(): Promise<void> {
  const argv = normalizeArgv(process.argv.slice(2));
  const cmd = argv[0];

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    printHelp();
    return;
  }

  if (cmd === "init") {
    const force = argv.includes("--force");
    try {
      await runInit(process.cwd(), { force });
    } catch (e) {
      console.error((e as Error).message);
      process.exitCode = 1;
    }
    return;
  }

  if (cmd === "setup") {
    const cwd = process.cwd();
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
    if (!Number.isFinite(nodeMajor) || nodeMajor < 18) {
      console.error(`Intent Merge needs Node.js 18 or newer (this is ${process.version}).`);
      process.exitCode = 1;
      return;
    }
    const plan = await pickDefault(DEFAULT_PLANS, cwd);
    const build = await pickDefault(DEFAULT_BUILDS, cwd);
    if (!plan || !build) {
      try {
        await runInit(cwd, { force: false });
        console.log(dim("\nCreated plan.md and build.ts in this folder.\n"));
      } catch (e) {
        console.error((e as Error).message);
        process.exitCode = 1;
        return;
      }
    } else {
      console.log(dim("plan.md and build.ts are already here — skipping init.\n"));
    }
    console.log(bold("Your ritual"));
    console.log(
      [
        "  1. Edit your markdown spec (plan.md) to describe what you want.",
        "  2. Edit build.ts (or your one implementation file) to match.",
        "  3. Run:  intent-merge check",
        "  4. If you are off spec, choose whether to update the spec or get a prompt to fix the code.",
        "",
        "Try a sample with no files required:",
        "  intent-merge check --demo",
        "",
        "Stress-test with a larger example (from repo root; off spec on purpose for the loop):",
        "  cd examples/billing-checkout-session && intent-merge check",
        "",
      ].join("\n"),
    );
    return;
  }

  if (cmd !== "check") {
    console.error(`Unknown command: ${cmd}\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  const rawRest = argv.slice(1);
  const { paths: pathArgs, resolutionToken, demo, verbose } = parseAfterCheck(rawRest);
  if (resolutionToken) {
    process.env.INTENT_MERGE_RESOLUTION = resolutionToken;
  }

  const cwd = process.cwd();
  const presentOpts = { verbose };
  let planPath: string;
  let buildPath: string;

  try {
    if (demo !== undefined) {
      if (pathArgs.length > 0) {
        throw new Error("Use either --demo or two file paths, not both.");
      }
      const d = demoPaths(packageRoot, demo);
      planPath = d.planPath;
      buildPath = d.buildPath;
      if (!(await fileExists(planPath)) || !(await fileExists(buildPath))) {
        throw new Error(`Demo files missing for "${d.folder}" (expected under package fixtures/).`);
      }
      console.log(dim(`Demo: fixtures/${d.folder}/ (plan + build)\n`));
    } else {
      [planPath, buildPath] = await resolvePaths(pathArgs, cwd);
    }
  } catch (e) {
    console.error((e as Error).message);
    process.exitCode = 1;
    return;
  }

  let planMd: string;
  let buildSource: string;
  try {
    planMd = await fs.readFile(planPath, "utf8");
    buildSource = await fs.readFile(buildPath, "utf8");
  } catch (e) {
    console.error("Could not read files:", (e as Error).message);
    process.exitCode = 1;
    return;
  }

  const result = comparePlanBuild(planMd, buildSource);

  if (result.kind === "aligned") {
    const plan = readPlan(planMd);
    console.log(presentAligned(plan.title, presentOpts));
    return;
  }

  if (result.kind === "insufficient_signal") {
    const plan = readPlan(planMd);
    console.log(presentInsufficient(plan.title, result.confidenceNote, presentOpts));
    return;
  }

  const { plan, build } = planBuildForDisplay(planMd, buildSource);
  console.log(presentMismatch(plan, build, result, presentOpts));

  const outcome = await promptResolution();
  if (outcome.kind === "noninteractive") {
    console.log(`
No resolution ran (not a TTY). Re-run with a flag, for example:

  intent-merge check --resolution=2 ${path.relative(cwd, planPath) || planPath} ${path.relative(cwd, buildPath) || buildPath}
`);
    return;
  }

  await applyResolution(outcome.choice, planPath, buildPath, planMd, buildSource, plan, build, result, {
    interactive: input.isTTY,
    verbose,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
