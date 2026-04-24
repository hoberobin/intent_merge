/**
 * Tests for folder-first UX (AC from issue #1).
 *
 * Run from repo root after: npm run build
 *
 *   node scripts/test-folder-check.mjs
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runFolderCheck, folderCheckHasFailure } from "../dist/folder-check.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "intent-merge.mjs");

// ── helpers ──────────────────────────────────────────────────────────────────

function run(args, env = {}, cwd = root) {
  return execFileSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    cwd,
    env: { ...process.env, INTENT_MERGE_RESOLUTION: "3", ...env },
  });
}

function runExpectFail(args, env = {}, cwd = root) {
  try {
    execFileSync(process.execPath, [bin, ...args], {
      encoding: "utf8",
      cwd,
      env: { ...process.env, INTENT_MERGE_RESOLUTION: "3", ...env },
    });
    return { exitCode: 0, stdout: "", stderr: "" };
  } catch (e) {
    return { exitCode: e.status, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

// Fixture content helpers
const ALIGNED_PLAN = readFileSync(join(root, "fixtures/01-aligned/plan.md"), "utf8");
const ALIGNED_BUILD = readFileSync(join(root, "fixtures/01-aligned/build.ts"), "utf8");
const MISMATCH_PLAN = readFileSync(join(root, "fixtures/03-missing-password/plan.md"), "utf8");
const MISMATCH_BUILD = readFileSync(join(root, "fixtures/03-missing-password/build.ts"), "utf8");
const VAGUE_PLAN = readFileSync(join(root, "fixtures/06-vague-plan/plan.md"), "utf8");
const VAGUE_BUILD = readFileSync(join(root, "fixtures/06-vague-plan/build.ts"), "utf8");

function makeTmpDir() {
  return mkdtempSync(join(root, "tmp-folder-check-"));
}

function addSubfolder(tmpDir, name, planContent, buildContent) {
  const subDir = join(tmpDir, name);
  mkdirSync(subDir, { recursive: true });
  writeFileSync(join(subDir, "plan.md"), planContent, "utf8");
  writeFileSync(join(subDir, "build.ts"), buildContent, "utf8");
  return subDir;
}

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, (e && e.message) || e);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, (e && e.message) || e);
    failed++;
  }
}

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ── Test 1: all-aligned folder ────────────────────────────────────────────────

await asyncTest("all-aligned folder: runFolderCheck returns all aligned", async () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "feature-a", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "feature-b", ALIGNED_PLAN, ALIGNED_BUILD);
    const result = await runFolderCheck(dir);
    must(result.mode === "multi", `expected mode multi, got ${result.mode}`);
    must(result.pairs.length === 2, `expected 2 pairs, got ${result.pairs.length}`);
    must(result.pairs.every((p) => p.kind === "aligned"), "expected all aligned");
    must(!folderCheckHasFailure(result), "expected no failure");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 2: mixed-result folder ───────────────────────────────────────────────

await asyncTest("mixed-result folder: detects mismatch and insufficient_signal", async () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "good", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "bad", MISMATCH_PLAN, MISMATCH_BUILD);
    addSubfolder(dir, "vague", VAGUE_PLAN, VAGUE_BUILD);
    const result = await runFolderCheck(dir);
    must(result.mode === "multi", `expected mode multi, got ${result.mode}`);
    must(result.pairs.length === 3, `expected 3 pairs, got ${result.pairs.length}`);
    const good = result.pairs.find((p) => p.folder === "good");
    const bad = result.pairs.find((p) => p.folder === "bad");
    const vague = result.pairs.find((p) => p.folder === "vague");
    must(good && good.kind === "aligned", "expected good to be aligned");
    must(bad && bad.kind === "mismatch", `expected bad to be mismatch, got ${bad && bad.kind}`);
    must(
      vague && vague.kind === "insufficient_signal",
      `expected vague to be insufficient_signal, got ${vague && vague.kind}`,
    );
    must(folderCheckHasFailure(result), "expected failure for mixed result");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 3: empty folder (no pairs) ──────────────────────────────────────────

await asyncTest("empty folder: returns empty pairs array", async () => {
  const dir = makeTmpDir();
  try {
    const result = await runFolderCheck(dir);
    must(result.mode === "multi", `expected mode multi, got ${result.mode}`);
    must(result.pairs.length === 0, `expected 0 pairs, got ${result.pairs.length}`);
    must(!folderCheckHasFailure(result), "expected no failure for empty");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 4: single-root-pair folder ──────────────────────────────────────────

await asyncTest("single-root-pair folder: uses root pair directly", async () => {
  const dir = makeTmpDir();
  try {
    writeFileSync(join(dir, "plan.md"), ALIGNED_PLAN, "utf8");
    writeFileSync(join(dir, "build.ts"), ALIGNED_BUILD, "utf8");
    const result = await runFolderCheck(dir);
    must(result.mode === "single", `expected mode single, got ${result.mode}`);
    must(result.pairs.length === 1, `expected 1 pair, got ${result.pairs.length}`);
    must(result.pairs[0].kind === "aligned", `expected aligned, got ${result.pairs[0].kind}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 5: JSON result shape ─────────────────────────────────────────────────

await asyncTest("mixed folder: JSON result includes required fields", async () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "feature-a", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "feature-b", MISMATCH_PLAN, MISMATCH_BUILD);
    const result = await runFolderCheck(dir);
    for (const p of result.pairs) {
      must(typeof p.folder === "string", "folder should be string");
      must(
        p.kind === "aligned" || p.kind === "mismatch" || p.kind === "insufficient_signal",
        "kind should be valid",
      );
      must(typeof p.title === "string", "title should be string");
      must(Array.isArray(p.mismatches), "mismatches should be array");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 6: CLI check <folder> — all aligned, exit 0 ─────────────────────────

test("CLI check <folder> all-aligned → exit 0 and labels by subfolder", () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "auth", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "billing", ALIGNED_PLAN, ALIGNED_BUILD);
    const out = run(["check", dir]);
    must(/auth/i.test(out), `expected subfolder name "auth" in output:\n${out}`);
    must(/billing/i.test(out), `expected subfolder name "billing" in output:\n${out}`);
    must(/on spec|aligned/i.test(out), `expected aligned status in output:\n${out}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 7: CLI check <folder> — mixed results, exit non-zero ────────────────

test("CLI check <folder> mixed results → exit non-zero", () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "good", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "bad", MISMATCH_PLAN, MISMATCH_BUILD);
    const { exitCode, stdout } = runExpectFail(["check", dir]);
    must(exitCode !== 0, `expected non-zero exit, got ${exitCode}`);
    must(/bad/i.test(stdout), `expected "bad" folder in output:\n${stdout}`);
    must(/good/i.test(stdout), `expected "good" folder in output:\n${stdout}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 8: CLI check <folder> — no pairs found, friendly error ───────────────

test("CLI check <folder> empty folder → friendly error message", () => {
  const dir = makeTmpDir();
  try {
    const { exitCode, stdout, stderr } = runExpectFail(["check", dir]);
    must(exitCode !== 0, `expected non-zero exit for empty folder, got ${exitCode}`);
    const allOutput = stdout + stderr;
    must(
      /no.*pair|intent.?merge.*looks|try|init|--demo/i.test(allOutput),
      `expected friendly error in output:\n${allOutput}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 9: CLI --json mode ───────────────────────────────────────────────────

test("CLI check <folder> --json → valid JSON array with required fields", () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "feat-x", ALIGNED_PLAN, ALIGNED_BUILD);
    addSubfolder(dir, "feat-y", MISMATCH_PLAN, MISMATCH_BUILD);
    const { exitCode, stdout } = runExpectFail(["check", dir, "--json"]);
    must(exitCode !== 0, `expected non-zero exit (mismatch), got ${exitCode}`);
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new Error(`expected valid JSON, got:\n${stdout}`);
    }
    must(Array.isArray(parsed), "expected JSON array");
    must(parsed.length === 2, `expected 2 items, got ${parsed.length}`);
    for (const item of parsed) {
      must("folder" in item, `missing field "folder" in: ${JSON.stringify(item)}`);
      must("kind" in item, `missing field "kind" in: ${JSON.stringify(item)}`);
      must("title" in item, `missing field "title" in: ${JSON.stringify(item)}`);
      must("mismatches" in item, `missing field "mismatches" in: ${JSON.stringify(item)}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 10: CLI --json all-aligned → exit 0 ─────────────────────────────────

test("CLI check <folder> --json all aligned → exit 0", () => {
  const dir = makeTmpDir();
  try {
    addSubfolder(dir, "a", ALIGNED_PLAN, ALIGNED_BUILD);
    const out = run(["check", dir, "--json"]);
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch {
      throw new Error(`expected valid JSON, got:\n${out}`);
    }
    must(Array.isArray(parsed), "expected JSON array");
    must(parsed.every((p) => p.kind === "aligned"), "expected all aligned");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Test 11: existing single-pair root behavior unchanged ─────────────────────

test("single-pair root: existing behavior unchanged (no subfolder discovery)", () => {
  const dir = makeTmpDir();
  try {
    writeFileSync(join(dir, "plan.md"), ALIGNED_PLAN, "utf8");
    writeFileSync(join(dir, "build.ts"), ALIGNED_BUILD, "utf8");
    // Also add a subfolder with a mismatch — root pair wins, should still be aligned
    addSubfolder(dir, "sub", MISMATCH_PLAN, MISMATCH_BUILD);
    const out = run(["check", dir]);
    must(/on spec|aligned/i.test(out), `expected aligned (root pair wins):\n${out}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Report ────────────────────────────────────────────────────────────────────

if (failed) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}
console.log(`\nAll folder-check tests passed (11 cases).`);
