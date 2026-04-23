import * as fs from "node:fs/promises";
import * as path from "node:path";

const PLAN = `# My feature

## What this should do
Describe the behavior in one or two sentences.

## Inputs
- email
- password

## Output
- user account
`;

const BUILD = `export function myFeature(email: string, password: string) {
  return { type: "user account", email, password };
}
`;

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function runInit(cwd: string, options: { force: boolean }): Promise<void> {
  const planPath = path.join(cwd, "plan.md");
  const buildPath = path.join(cwd, "build.ts");

  if (!options.force) {
    if (await exists(planPath)) {
      throw new Error(`plan.md already exists. Use --force to overwrite, or run check in this folder.`);
    }
    if (await exists(buildPath)) {
      throw new Error(`build.ts already exists. Use --force to overwrite.`);
    }
  }

  await fs.writeFile(planPath, PLAN, "utf8");
  await fs.writeFile(buildPath, BUILD, "utf8");
  console.log(`Created:\n  ${planPath}\n  ${buildPath}\n\nRun: intent-merge check`);
}
