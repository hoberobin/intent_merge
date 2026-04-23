/**
 * Smoke-test the main CLI entry paths (no human prompts).
 * Run from repo root after: npm run build
 *
 *   npm run test:paths
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "intent-merge.mjs");

function run(args, env = {}, cwd = root) {
  return execFileSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    cwd,
    env: { ...process.env, ...env },
  });
}

function must(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

let failed = 0;

function case_(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, (e && e.message) || e);
    failed++;
  }
}

case_("demo 03 → mismatch (defer)", () => {
  const out = run(["check", "--demo", "03"], { INTENT_MERGE_RESOLUTION: "3" });
  must(/Mismatch/i.test(out), "expected mismatch title");
});

case_("demo 01 → aligned", () => {
  const out = run(["check", "--demo", "01"], { INTENT_MERGE_RESOLUTION: "3" });
  must(/Aligned|No meaningful mismatch/i.test(out), "expected aligned");
});

case_("init + check in empty dir → aligned", () => {
  const dir = mkdtempSync(join(root, "tmp-smoke-"));
  try {
    run(["init"], {}, dir);
    const out = run(["check"], { INTENT_MERGE_RESOLUTION: "3" }, dir);
    must(/Aligned|No meaningful mismatch/i.test(out), "expected aligned after init");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

case_("explicit paths fixture 06 → insufficient", () => {
  const out = run([
    "check",
    join(root, "fixtures", "06-vague-plan", "plan.md"),
    join(root, "fixtures", "06-vague-plan", "build.ts"),
  ], { INTENT_MERGE_RESOLUTION: "3" });
  must(/Not enough signal|insufficient/i.test(out), "expected insufficient");
});

case_("omit check when first arg is .md", () => {
  const plan = join(root, "fixtures", "01-aligned", "plan.md");
  const build = join(root, "fixtures", "01-aligned", "build.ts");
  const out = run([plan, build], { INTENT_MERGE_RESOLUTION: "3" });
  must(/Aligned|No meaningful mismatch/i.test(out), "expected aligned for implicit check");
});

case_("same-folder defaults (plan.md + build.ts)", () => {
  const dir = mkdtempSync(join(root, "tmp-smoke-defaults-"));
  try {
    writeFileSync(
      join(dir, "plan.md"),
      readFileSync(join(root, "fixtures", "01-aligned", "plan.md"), "utf8"),
    );
    writeFileSync(
      join(dir, "build.ts"),
      readFileSync(join(root, "fixtures", "01-aligned", "build.ts"), "utf8"),
    );
    const out = run(["check"], { INTENT_MERGE_RESOLUTION: "3" }, dir);
    must(/Aligned|No meaningful mismatch/i.test(out), "expected aligned with defaults");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

if (failed) {
  console.error(`\n${failed} case(s) failed.`);
  process.exit(1);
}
console.log(`\nAll smoke path checks passed (${6} cases).`);
