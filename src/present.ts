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

export type PresentOpts = { compact?: boolean; verbose?: boolean };

function humanAligned(title: string): string {
  return [
    "",
    bold("On spec"),
    "",
    `Your markdown spec and implementation file look consistent for the checks this tool runs right now.`,
    "",
    dim(`Spec title: “${title}”`),
    "",
  ].join("\n");
}

function humanInsufficient(title: string, note?: string): string {
  const noteBlock = note ? `${dim(note)}\n\n` : "";
  return [
    "",
    bold("Not enough signal to compare"),
    "",
    `Intent Merge could not confidently compare “${title}” to your implementation file yet.`,
    "",
    noteBlock,
    dim("Add clear ## Inputs and ## Output sections to your markdown spec, then run check again."),
    "",
  ].join("\n");
}

function humanMismatch(plan: PlanSignals, result: CompareResult): string {
  const title = plan.title;
  const n = result.mismatches.length;
  const countLabel = n === 1 ? "1 finding" : `${n} findings`;
  const planSays = formatPlanSays(plan);
  const bullets = result.mismatches.map((m) => `- ${m.summary}`);
  const confidence = result.confidenceNote ? `\n${dim("Note: " + result.confidenceNote)}\n` : "";

  return [
    "",
    bold("Off spec"),
    "",
    `Your markdown spec and implementation file do not line up — ${countLabel}.`,
    "",
    subsection("What your spec is asking for"),
    ...planSays.map((l) => `  - ${l}`),
    subsection("What diverged"),
    ...bullets.map((b) => `  ${b.startsWith("-") ? b : "- " + b}`),
    confidence,
    dim("Technical detail about the implementation file is available with --verbose."),
    "",
    dim(hr("·")),
    "",
    "What would you like to do next?",
    "  [1]  Update the markdown spec to match the code",
    "  [2]  Get a prompt you can paste into an AI to fix the code",
    "  [3]  Decide later",
    "",
    dim("You can also type plain language, e.g. “update the spec”, “fix the code”, or “later”."),
    "",
  ].join("\n");
}

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
  if (!opts?.verbose) {
    return humanAligned(title);
  }
  return [
    sectionTitle(`Aligned — "${title}"`),
    "",
    bold("On spec"),
    dim(" (verbose)"),
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
  if (!opts?.verbose) {
    return humanInsufficient(title, note);
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

  if (!opts?.verbose && !opts?.compact) {
    return humanMismatch(plan, result);
  }

  const top = opts?.compact
    ? `\n${bold(`Mismatch — "${title}"`)}\n`
    : sectionTitle(`Mismatch — "${title}"`);

  return [
    top,
    opts?.verbose ? bold("Off spec (verbose)") + "\n\n" : "",
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
    "  [1]  Update the markdown spec to match the code",
    "  [2]  Get a prompt you can paste into an AI to fix the code",
    "  [3]  Decide later",
    "",
    dim("You can also type plain language, e.g. “update the spec”, “fix the code”, or “later”."),
    "",
  ].join("\n");
}
