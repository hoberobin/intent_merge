import type { PlanSignals } from "./types.js";

function normalizeBulletLine(line: string): string | null {
  const m = line.match(/^\s*[-*]\s+(.+)$/);
  if (!m) return null;
  return m[1].trim().toLowerCase();
}

function extractTitle(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "Untitled";
}

export function getSection(md: string, heading: string): string {
  const re = new RegExp(
    `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
    "im",
  );
  const match = md.match(re);
  if (!match || match.index === undefined) return "";
  const start = match.index + match[0].length;
  const rest = md.slice(start);
  const next = rest.search(/^##\s+/m);
  const body = next === -1 ? rest : rest.slice(0, next);
  return body.trim();
}

function bulletsFromSection(section: string): string[] {
  const out: string[] = [];
  for (const line of section.split("\n")) {
    const b = normalizeBulletLine(line);
    if (b) {
      const token = b.split(/[,:]/)[0].replace(/\s+/g, " ").trim();
      if (token) out.push(token);
    }
  }
  return out;
}

function extractConstraints(full: string): string[] {
  const found: string[] = [];
  if (/no\s+roles?\s+yet/gi.test(full)) found.push("No roles yet");
  else if (/\broles?\s+are\s+not\s+included\b/gi.test(full)) found.push("Roles are not included yet");
  else if (/\bno\s+roles?\b/gi.test(full)) found.push("No roles");
  if (/do\s+not\s+add\b/gi.test(full)) found.push("Do not add extra fields unless requested");
  if (/don't\s+add\b/gi.test(full)) found.push("Do not add extra fields unless requested");
  if (/keep\s+this\s+simple/gi.test(full) || /keep\s+it\s+simple/gi.test(full)) {
    found.push("Keep this simple");
  }
  return [...new Set(found)];
}

function extractConceptsFromProse(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "should",
    "using",
    "from",
    "when",
    "they",
    "them",
    "have",
    "been",
    "will",
    "into",
    "your",
    "users",
    "user",
    "able",
    "account",
    "create",
    "signup",
    "sign",
    "well",
  ]);
  return [...new Set(words.filter((w) => !stop.has(w)))];
}

export function readPlan(md: string): PlanSignals {
  const raw = md;
  const inputsSection = getSection(md, "Inputs");
  const outputSection = getSection(md, "Output");
  const whatSection = getSection(md, "What this should do");
  const notesSection = getSection(md, "Notes for agent");

  const inputs = bulletsFromSection(inputsSection);
  const outputPhrases: string[] = [];
  for (const line of outputSection.split("\n")) {
    const b = normalizeBulletLine(line);
    if (b) outputPhrases.push(b);
  }
  if (outputPhrases.length === 0 && outputSection.trim()) {
    outputPhrases.push(outputSection.trim().toLowerCase());
  }

  const title = extractTitle(md);
  const proseForConcepts = [whatSection, notesSection, getSection(md, "What this should do")].join(
    "\n",
  );
  const concepts = extractConceptsFromProse(
    [whatSection, notesSection, title, inputsSection, outputSection].join("\n"),
  );
  const constraints = extractConstraints(md);

  return {
    title,
    inputs,
    outputPhrases,
    constraints,
    concepts,
    whatThisShouldDo: whatSection,
    notesForAgent: notesSection,
    raw,
  };
}

export function isPlanTooVague(plan: PlanSignals): boolean {
  const hasInputBullets = plan.inputs.length > 0;
  const hasOutput = plan.outputPhrases.length > 0;
  const whatLen = plan.whatThisShouldDo.trim().length;
  if (hasInputBullets || hasOutput) return false;
  if (whatLen >= 80) return false;
  const bodyChars = plan.raw.replace(/^#\s+.*/m, "").replace(/\s/g, "").length;
  return bodyChars < 60;
}
