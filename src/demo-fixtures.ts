import { join } from "node:path";

/** Map short id or alias → folder under fixtures/ */
const SLUGS: Record<string, string> = {
  "01": "01-aligned",
  "02": "02-role-added",
  "03": "03-missing-password",
  "04": "04-token-output",
  "05": "05-async-warning",
  "06": "06-vague-plan",
  aligned: "01-aligned",
  roles: "02-role-added",
  password: "03-missing-password",
  token: "04-token-output",
  async: "05-async-warning",
  vague: "06-vague-plan",
};

export function listDemoIds(): string[] {
  return ["01", "02", "03", "04", "05", "06"];
}

export function resolveDemoFolder(spec?: string): string {
  const raw = (spec ?? "03").trim().replace(/^fixtures[/\\]/, "");
  if (!raw) return "03-missing-password";
  if (SLUGS[raw]) return SLUGS[raw];
  if (/^\d{2}-/.test(raw)) return raw;
  return "03-missing-password";
}

export function demoPaths(packageRoot: string, spec?: string): { planPath: string; buildPath: string; folder: string } {
  const folder = resolveDemoFolder(spec);
  return {
    folder,
    planPath: join(packageRoot, "fixtures", folder, "plan.md"),
    buildPath: join(packageRoot, "fixtures", folder, "build.ts"),
  };
}
