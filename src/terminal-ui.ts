import { stdout } from "node:process";

const MIN_W = 48;
const MAX_W = 78;

export function termWidth(): number {
  const c = stdout.columns;
  if (c && c >= MIN_W) return Math.min(c - 2, MAX_W);
  return 66;
}

export function useColor(): boolean {
  return Boolean(stdout.isTTY && !process.env.NO_COLOR);
}

function esc(...codes: number[]): string {
  if (!useColor()) return "";
  return `\x1b[${codes.join(";")}m`;
}

const R = () => (useColor() ? "\x1b[0m" : "");

export function bold(s: string): string {
  if (!useColor()) return s;
  return `${esc(1)}${s}${R()}`;
}

export function dim(s: string): string {
  if (!useColor()) return s;
  return `${esc(2)}${s}${R()}`;
}

export function cyan(s: string): string {
  if (!useColor()) return s;
  return `${esc(36)}${s}${R()}`;
}

export function red(s: string): string {
  if (!useColor()) return s;
  return `${esc(31)}${s}${R()}`;
}

export function green(s: string): string {
  if (!useColor()) return s;
  return `${esc(32)}${s}${R()}`;
}

export function hr(char = "─"): string {
  return char.repeat(termWidth());
}

/** Major block: full-width rules + bold title */
export function sectionTitle(title: string): string {
  const line = hr();
  return `\n${line}\n${bold(title)}\n${line}\n`;
}

/** Smaller label inside a block */
export function subsection(label: string): string {
  return `\n${cyan("▸ " + label)}\n`;
}

/** Short legend for naive line diffs */
export function diffLegend(beforeLabel: string, afterLabel: string): string {
  const top = hr("·");
  return [
    "",
    dim(top),
    dim(`  Reading the diff below:`),
    `    ${red("- text")}  ${dim("= from " + beforeLabel + " (old)")}`,
    `    ${green("+ text")}  ${dim("= from " + afterLabel + " (new)")}`,
    dim("  (Simple line-by-line view — not a full merge diff.)"),
    dim(top),
    "",
  ].join("\n");
}
