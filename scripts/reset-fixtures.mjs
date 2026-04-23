/**
 * Reset fixture plan/build (and expected) files to the last committed version,
 * and remove generated `.intent-merge/` folders under fixtures.
 *
 * Usage (from repo root):
 *   npm run fixtures:reset
 *   npm run fixtures:reset -- 03-missing-password
 *
 * Requires git. Tracked files are restored with `git restore`; untracked
 * `.intent-merge` dirs are deleted so option 1/2 test artifacts disappear.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function isGitRepo(dir) {
  try {
    execFileSync("git", ["-C", dir, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

function removeIntentMergeUnder(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === ".intent-merge") {
        rmSync(p, { recursive: true, force: true });
        console.log("removed", relative(root, p));
      } else {
        removeIntentMergeUnder(p);
      }
    }
  }
}

function resolveFixtureArg(arg) {
  if (!arg) return join(root, "fixtures");
  const cleaned = arg.replace(/^fixtures\//, "");
  const full = join(root, "fixtures", cleaned);
  if (!existsSync(full)) {
    console.error(`Not found: fixtures/${cleaned}`);
    process.exit(1);
  }
  return full;
}

const arg = process.argv[2];
const target = resolveFixtureArg(arg);

if (!isGitRepo(root)) {
  console.warn("Not a git repository: skipping git restore (cannot reset tracked files automatically).");
  console.warn("Removing .intent-merge folders under fixtures only.");
  removeIntentMergeUnder(join(root, "fixtures"));
  console.log("\nDone. Restore plan.md / build.ts manually from a clone or backup, then run: npm run verify");
  process.exit(0);
}

try {
  const rel = relative(root, target) || ".";
  execFileSync("git", ["-C", root, "restore", "--source=HEAD", "--staged", "--worktree", rel], {
    stdio: "inherit",
  });
} catch {
  try {
    const rel = relative(root, target) || ".";
    execFileSync("git", ["-C", root, "checkout", "HEAD", "--", rel], { stdio: "inherit" });
  } catch (e2) {
    console.error("git restore/checkout failed. Fix conflicts or run from repo root.", e2.message);
    process.exit(1);
  }
}

removeIntentMergeUnder(target);

console.log(`\nReset complete: ${relative(root, target)}`);
console.log("Run: npm run verify");
