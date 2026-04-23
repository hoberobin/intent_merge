import { dim, green, red, useColor } from "./terminal-ui.js";

/** Simple line-by-line diff for small files (readable, not minimal edit distance). */
export function formatLineDiff(
  before: string,
  after: string,
  options?: { beforeLabel?: string; afterLabel?: string },
): string {
  if (before === after) return dim("(no changes in this comparison)\n");

  const a = before.split("\n");
  const b = after.split("\n");
  const max = Math.max(a.length, b.length);
  const lines: string[] = [];
  for (let i = 0; i < max; i++) {
    const x = a[i] ?? "";
    const y = b[i] ?? "";
    if (x !== y) {
      lines.push(colorMinus(`-${x}`));
      lines.push(colorPlus(`+${y}`));
    }
  }
  const text = lines.join("\n");
  const cap = 8000;
  const body = text.length > cap ? text.slice(0, cap) + "\n... (truncated for display)\n" : text + "\n";

  const bl = options?.beforeLabel ?? "before";
  const al = options?.afterLabel ?? "after";
  const header =
    options?.beforeLabel || options?.afterLabel
      ? `${dim(`[ ${bl} → ${al} — ${max} line positions ]`)}\n\n`
      : "";
  return header + body;
}

function colorMinus(line: string): string {
  return useColor() ? red(line) : line;
}

function colorPlus(line: string): string {
  return useColor() ? green(line) : line;
}
