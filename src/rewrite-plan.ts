import { getSection } from "./plan-reader.js";
import type { BuildSignals, MismatchDetail, PlanSignals } from "./types.js";

function inferOutputDescription(build: BuildSignals): string {
  const lit = build.returnStringLiterals.join(" ");
  if (lit.includes("user account")) return "user account";
  if (build.returnKeys.includes("token")) return "an access token";
  if (lit.includes("queued")) return "a queued send confirmation";
  if (build.returnKeys.includes("status")) return "a status object describing what happened";
  return "the current return shape from the build";
}

function stripNoRoles(text: string): string {
  return text
    .replace(/\bno\s+roles?\s+yet\.?/gi, "")
    .replace(/\broles?\s+are\s+not\s+included\s+yet\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceSection(md: string, heading: string, newBody: string): string {
  const re = new RegExp(
    `^(##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$)([\\s\\S]*?)(?=^##\\s+|$)`,
    "m",
  );
  if (!re.test(md)) {
    const insertion =
      md.endsWith("\n") || md.length === 0
        ? `\n## ${heading}\n\n${newBody}\n`
        : `\n\n## ${heading}\n\n${newBody}\n`;
    return md + insertion;
  }
  return md.replace(re, (_, h: string) => `${h}\n\n${newBody.trim()}\n\n`);
}

export function rewritePlanToMatchBuild(original: string, plan: PlanSignals, build: BuildSignals): string {
  let md = original;
  const inputBullets = build.parameters.map((p) => `- ${p}`).join("\n");
  md = replaceSection(md, "Inputs", inputBullets);

  const outputLine = `- ${inferOutputDescription(build)}`;
  md = replaceSection(md, "Output", outputLine);

  const what = getSection(md, "What this should do");
  const baseWhat = what || plan.whatThisShouldDo;
  let nextWhat = baseWhat;
  if (build.parameters.includes("role")) {
    nextWhat = stripNoRoles(nextWhat);
    if (!/role/i.test(nextWhat)) {
      nextWhat = `${nextWhat} An optional role may also be included during signup.`.trim();
    }
  }
  if (buildLooksTokenOnly(build)) {
    nextWhat = `${stripNoRoles(nextWhat)} The API returns a token instead of a full user object.`.trim();
  }
  if (build.isAsync || build.returnStringLiterals.some((s) => s.includes("queued"))) {
    nextWhat = `${nextWhat} Sending may be asynchronous or queued in practice.`.trim();
  }
  if (getSection(md, "What this should do")) {
    md = replaceSection(md, "What this should do", nextWhat);
  }

  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function buildLooksTokenOnly(build: BuildSignals): boolean {
  return build.returnKeys.includes("token");
}

function requestedChanges(mismatches: MismatchDetail[], build: BuildSignals): string[] {
  const out: string[] = [];
  for (const m of mismatches) {
    switch (m.code) {
      case "negative_constraint_roles":
      case "build_input_not_in_plan":
        if (build.parameters.includes("role")) {
          out.push("- remove role handling from signup so it stays limited to what the plan describes");
        }
        break;
      case "plan_input_missing_in_build":
        out.push("- restore any missing plan inputs in the function signature and flow");
        break;
      case "output_token_vs_account":
        out.push("- return a user account (or equivalent) instead of token-only output, matching the plan");
        break;
      case "async_or_deferred":
        out.push("- if the plan should stay immediate and simple, avoid async queues for this step");
        break;
      default:
        break;
    }
  }
  const dedup = [...new Set(out)];
  if (dedup.length === 0) {
    return ["- align the build with the plan intent above", "- keep unrelated behavior intact unless it conflicts with the plan"];
  }
  dedup.push("- keep unrelated behavior intact unless it conflicts with the plan");
  return dedup;
}

export function buildFixPrompt(plan: PlanSignals, build: BuildSignals, mismatches: MismatchDetail[]): string {
  const planIntent = formatPlanIntent(plan);
  const mismatch = mismatches.map((m) => `- ${m.summary}`).join("\n");
  const requested = requestedChanges(mismatches, build).map((l) => (l.startsWith("-") ? l : `- ${l}`));
  return [
    `Please update the implementation of ${plan.title} to match the current plan.`,
    "",
    "Plan intent:",
    ...planIntent,
    "",
    "Current build mismatch:",
    mismatch,
    "",
    "Requested change:",
    ...requested,
  ].join("\n");
}

function formatPlanIntent(plan: PlanSignals): string[] {
  const lines: string[] = [];
  if (plan.whatThisShouldDo.trim()) {
    lines.push(...plan.whatThisShouldDo.split("\n").map((l) => `- ${l.trim()}`).filter((l) => l !== "-"));
  }
  if (plan.inputs.length) lines.push(`- inputs should include: ${plan.inputs.join(", ")}`);
  if (plan.outputPhrases.length) lines.push(`- output should reflect: ${plan.outputPhrases.join(", ")}`);
  if (plan.constraints.length) {
    lines.push(...plan.constraints.map((c) => `- ${c.trim()}`));
  }
  return lines.length ? lines : ["- (see plan file for full intent)"];
}
