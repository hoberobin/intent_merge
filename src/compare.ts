import { isPlanTooVague, readPlan } from "./plan-reader.js";
import { readBuild } from "./build-reader.js";
import type { BuildSignals, CompareResult, MismatchDetail, PlanSignals } from "./types.js";

function planForbidsRoles(plan: PlanSignals): boolean {
  const t = plan.raw.toLowerCase();
  return /no\s+roles?\b/.test(t) || /roles?\s+are\s+not/.test(t) || /roles?\s+not\s+included/.test(t);
}

function planMentionsInput(plan: PlanSignals, name: string): boolean {
  const n = name.toLowerCase();
  if (plan.inputs.some((i) => i.includes(n) || n.includes(i))) return true;
  if (n === "role" && planForbidsRoles(plan)) return false;
  const blob = [
    plan.whatThisShouldDo,
    plan.raw,
    ...plan.outputPhrases,
    ...plan.concepts,
  ]
    .join(" ")
    .toLowerCase();
  if (blob.includes(n)) return true;
  if (n === "role" && /roles?/.test(blob)) return true;
  return false;
}

function outputImpliesUserAccount(plan: PlanSignals): boolean {
  const o = plan.outputPhrases.join(" ").toLowerCase();
  if (o.includes("user account") || o.includes("account")) return true;
  if (plan.whatThisShouldDo.toLowerCase().includes("account")) return true;
  return false;
}

function buildLooksLikeUserAccount(build: BuildSignals): boolean {
  const lit = build.returnStringLiterals.join(" ");
  const keys = build.returnKeys.join(" ");
  if (lit.includes("user account")) return true;
  if (keys.includes("email") && (lit.includes("user") || keys.includes("type"))) return true;
  return false;
}

function buildLooksTokenOnly(build: BuildSignals): boolean {
  if (build.returnKeys.includes("token") && !buildLooksLikeUserAccount(build)) return true;
  return false;
}

function planImpliesImmediateSimple(plan: PlanSignals): boolean {
  const w = plan.whatThisShouldDo.toLowerCase();
  if (w.includes("right away") || w.includes("immediately")) return true;
  if (w.includes("keep this simple") || w.includes("keep it simple")) return true;
  return false;
}

function buildLooksDeferred(build: BuildSignals): boolean {
  if (build.isAsync) return true;
  const lit = build.returnStringLiterals.join(" ");
  if (lit.includes("queued") || lit.includes("queue")) return true;
  if (build.returnKeys.includes("status") && lit.includes("queued")) return true;
  return false;
}

export function comparePlanBuild(planMd: string, buildSource: string): CompareResult {
  const build = readBuild(buildSource);
  if (!build) {
    return {
      kind: "insufficient_signal",
      mismatches: [],
      confidenceNote: "The build file does not contain a clear primary exported function to compare.",
    };
  }

  const plan = readPlan(planMd);
  if (isPlanTooVague(plan)) {
    return {
      kind: "insufficient_signal",
      mismatches: [],
      confidenceNote:
        "The plan is too vague to compare confidently. Add explicit Inputs and Output sections when you can.",
    };
  }

  const mismatches: MismatchDetail[] = [];

  for (const input of plan.inputs) {
    const token = input.split(/\s+/)[0];
    if (!build.parameters.some((p) => p === token || p.includes(token) || token.includes(p))) {
      mismatches.push({
        code: "plan_input_missing_in_build",
        summary: `the plan expects ${input}, but the build only appears to use ${build.parameters.join(", ") || "no matching parameters"}`,
        strength: "clear",
      });
    }
  }

  for (const param of build.parameters) {
    if (!planMentionsInput(plan, param)) {
      mismatches.push({
        code: "build_input_not_in_plan",
        summary: `the build includes ${param}, which is not reflected in the plan inputs`,
        strength: "clear",
      });
    }
  }

  if (planForbidsRoles(plan) && build.parameters.includes("role")) {
    mismatches.push({
      code: "negative_constraint_roles",
      summary: 'the plan explicitly says roles are not included yet, but the build includes an optional role',
      strength: "clear",
    });
  }

  if (outputImpliesUserAccount(plan) && buildLooksTokenOnly(build)) {
    mismatches.push({
      code: "output_token_vs_account",
      summary: "the plan suggests returning a user account, but the build appears to return a token only",
      strength: "clear",
    });
  }

  if (planImpliesImmediateSimple(plan) && buildLooksDeferred(build)) {
    mismatches.push({
      code: "async_or_deferred",
      summary:
        "the build appears async or queued, while the plan reads like a simpler direct action — this may be fine, but it is worth double-checking",
      strength: "likely",
    });
  }

  const deduped = dedupeMismatches(mismatches);
  if (deduped.length === 0) {
    return { kind: "aligned", mismatches: [] };
  }

  const hasLikelyOnly = deduped.every((m) => m.strength === "likely");
  const confidenceNote = hasLikelyOnly
    ? "The signal here is softer; treat this as a heads-up rather than a hard finding."
    : undefined;

  return { kind: "mismatch", mismatches: deduped, confidenceNote };
}

function dedupeMismatches(items: MismatchDetail[]): MismatchDetail[] {
  const seen = new Set<string>();
  const out: MismatchDetail[] = [];
  for (const m of items) {
    const key = m.code + "|" + m.summary;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export function planBuildForDisplay(planMd: string, buildSource: string): {
  plan: PlanSignals;
  build: BuildSignals;
} {
  const plan = readPlan(planMd);
  const build = readBuild(buildSource);
  if (!build) throw new Error("unreadable build");
  return { plan, build };
}
