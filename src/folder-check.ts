/**
 * folder-check.ts
 *
 * Discovers plan+build pairs in a folder (either at the root or in immediate
 * subdirectories) and runs a comparison on each one.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { comparePlanBuild } from "./compare.js";
import { readPlan } from "./plan-reader.js";
import type { CompareResult } from "./types.js";

const DEFAULT_PLANS = ["plan.md", "feature.md"];
// Note: folder-check.ts accepts .js builds (for compiled/JS-first projects) while cli.ts's
// single-pair fallback only checks ["build.ts", "index.ts"]. If these lists are ever unified,
// update the error message in cli.ts's resolvePaths() to match.
const DEFAULT_BUILDS = ["build.ts", "index.ts", "build.js", "index.js"];

export interface FolderPairResult {
  folder: string;
  kind: CompareResult["kind"];
  title: string;
  mismatches: CompareResult["mismatches"];
  /** Absolute paths used; present for internal routing only. */
  _planPath?: string;
  _buildPath?: string;
}

export interface FolderCheckResult {
  mode: "multi" | "single";
  pairs: FolderPairResult[];
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findPlanBuildPair(
  dir: string,
): Promise<{ planPath: string; buildPath: string } | null> {
  for (const planName of DEFAULT_PLANS) {
    for (const buildName of DEFAULT_BUILDS) {
      const planPath = path.join(dir, planName);
      const buildPath = path.join(dir, buildName);
      if ((await fileExists(planPath)) && (await fileExists(buildPath))) {
        return { planPath, buildPath };
      }
    }
  }
  return null;
}

async function checkPair(
  folderName: string,
  planPath: string,
  buildPath: string,
): Promise<FolderPairResult> {
  const planMd = await fs.readFile(planPath, "utf8");
  const buildSource = await fs.readFile(buildPath, "utf8");
  const result = comparePlanBuild(planMd, buildSource);
  const plan = readPlan(planMd);
  return {
    folder: folderName,
    kind: result.kind,
    title: plan.title,
    mismatches: result.mismatches,
    _planPath: planPath,
    _buildPath: buildPath,
  };
}

/**
 * Run folder-first check on the given directory.
 *
 * Strategy:
 * 1. Check if the directory itself has a plan+build pair (single-root mode).
 * 2. Otherwise, scan immediate subdirectories for plan+build pairs (multi mode).
 * 3. If neither found, return an empty pairs array so the caller can show an error.
 */
export async function runFolderCheck(folderPath: string): Promise<FolderCheckResult> {
  const rootPair = await findPlanBuildPair(folderPath);
  if (rootPair) {
    const folderName = path.basename(folderPath);
    const pairResult = await checkPair(folderName, rootPair.planPath, rootPair.buildPath);
    return { mode: "single", pairs: [pairResult] };
  }

  // Scan immediate subdirectories
  let entries: string[];
  try {
    const dirents = await fs.readdir(folderPath, { withFileTypes: true });
    entries = dirents
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return { mode: "multi", pairs: [] };
  }

  const pairs: FolderPairResult[] = [];
  for (const entry of entries) {
    const subDir = path.join(folderPath, entry);
    const pair = await findPlanBuildPair(subDir);
    if (pair) {
      const pairResult = await checkPair(entry, pair.planPath, pair.buildPath);
      pairs.push(pairResult);
    }
  }

  return { mode: "multi", pairs };
}

/** Returns true if any pair result should cause a non-zero exit code. */
export function folderCheckHasFailure(result: FolderCheckResult): boolean {
  return result.pairs.some((p) => p.kind !== "aligned");
}
