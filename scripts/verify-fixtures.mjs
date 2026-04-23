import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { comparePlanBuild } from "../dist/compare.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Array<{ name: string; plan: string; build: string; expect: string; expectCodes?: string[] }>} */
const cases = [
  {
    name: "01-aligned",
    plan: "fixtures/01-aligned/plan.md",
    build: "fixtures/01-aligned/build.ts",
    expect: "aligned",
  },
  {
    name: "02-role-added",
    plan: "fixtures/02-role-added/plan.md",
    build: "fixtures/02-role-added/build.ts",
    expect: "mismatch",
    expectCodes: ["negative_constraint_roles"],
  },
  {
    name: "03-missing-password",
    plan: "fixtures/03-missing-password/plan.md",
    build: "fixtures/03-missing-password/build.ts",
    expect: "mismatch",
    expectCodes: ["plan_input_missing_in_build"],
  },
  {
    name: "04-token-output",
    plan: "fixtures/04-token-output/plan.md",
    build: "fixtures/04-token-output/build.ts",
    expect: "mismatch",
    expectCodes: ["output_token_vs_account"],
  },
  {
    name: "05-async-warning",
    plan: "fixtures/05-async-warning/plan.md",
    build: "fixtures/05-async-warning/build.ts",
    expect: "mismatch",
    expectCodes: ["async_or_deferred"],
  },
  {
    name: "06-vague-plan",
    plan: "fixtures/06-vague-plan/plan.md",
    build: "fixtures/06-vague-plan/build.ts",
    expect: "insufficient_signal",
  },
];

function codesEqual(a, b) {
  const sa = [...a].sort().join("\0");
  const sb = [...b].sort().join("\0");
  return sa === sb;
}

let failed = false;
for (const c of cases) {
  const planMd = readFileSync(join(root, c.plan), "utf8");
  const buildSrc = readFileSync(join(root, c.build), "utf8");
  const r = comparePlanBuild(planMd, buildSrc);
  if (r.kind !== c.expect) {
    console.error(`FAIL ${c.name}: expected kind ${c.expect}, got ${r.kind}`);
    failed = true;
    continue;
  }

  if (c.expect === "mismatch" && c.expectCodes) {
    const got = r.mismatches.map((m) => m.code);
    if (!codesEqual(got, c.expectCodes)) {
      console.error(
        `FAIL ${c.name}: expected mismatch codes [${c.expectCodes.join(", ")}], got [${got.join(", ")}]`,
      );
      failed = true;
      continue;
    }
  } else if (r.mismatches.length > 0 && c.expect !== "mismatch") {
    console.error(
      `FAIL ${c.name}: expected no mismatches for kind ${c.expect}, got: ${r.mismatches.map((m) => m.code).join(", ")}`,
    );
    failed = true;
    continue;
  }

  console.log(`ok ${c.name}: ${r.kind}${c.expectCodes ? ` (${c.expectCodes.join(", ")})` : ""}`);
}

if (failed) process.exit(1);
