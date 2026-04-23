import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { comparePlanBuild } from "../dist/compare.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  },
  {
    name: "03-missing-password",
    plan: "fixtures/03-missing-password/plan.md",
    build: "fixtures/03-missing-password/build.ts",
    expect: "mismatch",
  },
  {
    name: "04-token-output",
    plan: "fixtures/04-token-output/plan.md",
    build: "fixtures/04-token-output/build.ts",
    expect: "mismatch",
  },
  {
    name: "05-async-warning",
    plan: "fixtures/05-async-warning/plan.md",
    build: "fixtures/05-async-warning/build.ts",
    expect: "mismatch",
  },
  {
    name: "06-vague-plan",
    plan: "fixtures/06-vague-plan/plan.md",
    build: "fixtures/06-vague-plan/build.ts",
    expect: "insufficient_signal",
  },
];

let failed = false;
for (const c of cases) {
  const planMd = readFileSync(join(root, c.plan), "utf8");
  const buildSrc = readFileSync(join(root, c.build), "utf8");
  const r = comparePlanBuild(planMd, buildSrc);
  if (r.kind !== c.expect) {
    console.error(`FAIL ${c.name}: expected ${c.expect}, got ${r.kind}`);
    failed = true;
  } else {
    console.log(`ok ${c.name}: ${r.kind}`);
  }
}

if (failed) process.exit(1);
