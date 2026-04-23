import type { BuildSignals, CompareResult, PlanSignals } from "./types.js";
import { bold, dim, hr, sectionTitle, subsection } from "./terminal-ui.js";

function formatPlanSays(plan: PlanSignals): string[] {
  const lines: string[] = [];
  if (plan.whatThisShouldDo.trim()) {
    lines.push(...plan.whatThisShouldDo.split("\n").map((l) => l.trim()).filter(Boolean));
  }
  if (plan.inputs.length) {
    lines.push(`inputs include: ${plan.inputs.join(", ")}`);
  }
  if (plan.outputPhrases.length) {
    lines.push(`output aims for: ${plan.outputPhrases.join(", ")}`);
  }
  const whatLower = plan.whatThisShouldDo.toLowerCase();
  for (const c of plan.constraints) {
    const t = c.trim();
    if (t && !whatLower.includes(t.toLowerCase())) lines.push(t);
  }
  if (lines.length === 0) lines.push(plan.raw.trim().split("\n").slice(0, 5).join(" "));
  return lines;
}

function formatBuildAppears(build: BuildSignals): string[] {
  const lines: string[] = [];
  lines.push(`function ${build.functionName}(${build.parameters.join(", ")})`);
  if (build.isAsync) lines.push("the implementation is async");
  if (build.returnKeys.length || build.returnStringLiterals.length) {
    const bits = [...build.returnKeys, ...build.returnStringLiterals.map((s) => `"${s}"`)];
    lines.push(`return shape appears to include: ${bits.join(", ")}`);
  }
  return lines;
}

export type PresentOpts = { compact?: boolean };

export function presentAligned(title: string, opts?: PresentOpts): string {
  if (opts?.compact) {
    return [
      `\n${bold(`Aligned — "${title}"`)}`,
      "",
      "No meaningful mismatch was found for the checks this tool can do right now.",
      dim("Your plan and build look consistent enough to keep building."),
      "",
    ].join("\n");
  }
  return [
    sectionTitle(`Aligned — "${title}"`),
    "",
    "No meaningful mismatch was found for the checks this tool can do right now.",
    "",
    dim("Your plan and build look consistent enough to keep building."),
    "",
  ].join("\n");
}

export function presentInsufficient(title: string, note?: string, opts?: PresentOpts): string {
  const tail = note ? `\n${dim(note)}\n` : "\n";
  if (opts?.compact) {
    return [
      `\n${bold(`Not enough signal — "${title}"`)}`,
      tail,
      dim("Add clearer Inputs and Output to the plan, then run check again."),
      "",
    ].join("\n");
  }
  return [
    sectionTitle(`Not enough signal — "${title}"`),
    tail,
    dim("Add clearer Inputs and Output to the plan, then run check again."),
    "",
  ].join("\n");
}

export function presentMismatch(
  plan: PlanSignals,
  build: BuildSignals,
  result: CompareResult,
  opts?: PresentOpts,
): string {
  const title = plan.title;
  const bullets = result.mismatches.map((m) => `- ${m.summary}`);
  const planSays = formatPlanSays(plan);
  const buildSays = formatBuildAppears(build);
  const confidence = result.confidenceNote ? `\n${dim("Note: " + result.confidenceNote)}\n` : "";

  const top = opts?.compact
    ? `\n${bold(`Mismatch — "${title}"`)}\n`
    : sectionTitle(`Mismatch — "${title}"`);

  return [
    top,
    subsection("Your plan says"),
    ...planSays.map((l) => `  - ${l}`),
    subsection("Your build now appears to include"),
    ...buildSays.map((l) => `  - ${l}`),
    subsection("Why this matters"),
    "  - your plan and build may now be telling the AI two different stories",
    "  - future prompts may rely on the wrong source of truth",
    subsection("What diverged"),
    ...bullets.map((b) => `  ${b.startsWith("-") ? b : "- " + b}`),
    confidence,
    "",
    dim(hr("·")),
    "",
    "What would you like to do next?",
    "  [1]  Update plan",
    "  [2]  Generate build-fix prompt",
    "  [3]  Decide later",
    "",
  ].join("\n");
}
