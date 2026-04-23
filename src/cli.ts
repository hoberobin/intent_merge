import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(packageRoot, ".env") });

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readPlan } from "./plan-reader.js";
import { comparePlanBuild, planBuildForDisplay } from "./compare.js";
import { presentAligned, presentInsufficient, presentMismatch } from "./present.js";
import { applyResolution, promptResolution } from "./resolve.js";

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

async function pickDefault(candidates: string[], label: string, cwd: string): Promise<string | null> {
  for (const name of candidates) {
    const full = path.join(cwd, name);
    if (await fileExists(full)) return full;
  }
  return null;
}

async function askPath(rl: readline.Interface, label: string): Promise<string> {
  const raw = (await rl.question(`Enter path to ${label}: `)).trim();
  return path.resolve(raw);
}

function parseCheckRest(rest: string[]): {
  paths: string[];
  resolutionToken?: string;
} {
  const paths: string[] = [];
  let resolutionToken: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
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
  return { paths, resolutionToken };
}

async function resolvePaths(pathArgs: string[], cwd: string): Promise<[string, string]> {
  if (pathArgs.length >= 2) {
    return [path.resolve(pathArgs[0]), path.resolve(pathArgs[1])];
  }
  if (pathArgs.length === 1) {
    throw new Error("Provide both plan and build paths, or run with no paths for guided mode.");
  }
  const plan = await pickDefault(DEFAULT_PLANS, "plan", cwd);
  const build = await pickDefault(DEFAULT_BUILDS, "build", cwd);
  if (plan && build) return [plan, build];
  const rl = readline.createInterface({ input, output });
  try {
    const p = plan ?? (await askPath(rl, "plan markdown file"));
    const b = build ?? (await askPath(rl, "build TypeScript file"));
    return [p, b];
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] !== "check") {
    console.log(`Usage: intent-merge check [plan.md] [build.ts] [--resolution=1|2|3 | 1|2|3]

Run with no file paths to try plan.md / feature.md and build.ts / index.ts in the current directory.

When there is a mismatch, type 1, 2, or 3 at the prompt (in an interactive terminal), or pass --resolution=2 / a trailing 2, or set INTENT_MERGE_RESOLUTION.

After option 2: with OPENAI_API_KEY, you get an AI draft, open it in your editor, revise, then apply; otherwise use the saved prompt / hook / manual edit, then re-check. Optional: INTENT_MERGE_HOOK runs your command with INTENT_MERGE_PROMPT_FILE set.`);
    process.exitCode = 1;
    return;
  }

  const rawRest = argv.slice(1);
  const { paths: pathArgs, resolutionToken } = parseCheckRest(rawRest);
  if (resolutionToken) {
    process.env.INTENT_MERGE_RESOLUTION = resolutionToken;
  }

  const cwd = process.cwd();
  let planPath: string;
  let buildPath: string;
  try {
    [planPath, buildPath] = await resolvePaths(pathArgs, cwd);
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
    console.log(presentAligned(plan.title));
    return;
  }

  if (result.kind === "insufficient_signal") {
    const plan = readPlan(planMd);
    console.log(presentInsufficient(plan.title, result.confidenceNote));
    return;
  }

  const { plan, build } = planBuildForDisplay(planMd, buildSource);
  console.log(presentMismatch(plan, build, result));

  const outcome = await promptResolution();
  if (outcome.kind === "noninteractive") {
    console.log(`
No resolution ran because this session is not interactive (stdin is not a terminal).

Run the same check again with one of:

  INTENT_MERGE_RESOLUTION=1  (Update plan — writes the plan file; no interactive preview)
  INTENT_MERGE_RESOLUTION=2  (Generate build-fix prompt — saves prompt file + prints; no re-check)
  INTENT_MERGE_RESOLUTION=3  (Decide later — no file changes)

In a normal terminal, you can type 1, 2, or 3 when prompted. You can also pass the choice on the command line:

  node bin/intent-merge.mjs check plan.md build.ts --resolution=2
  node bin/intent-merge.mjs check plan.md build.ts 2
`);
    return;
  }

  await applyResolution(outcome.choice, planPath, buildPath, planMd, buildSource, plan, build, result, {
    interactive: input.isTTY,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
