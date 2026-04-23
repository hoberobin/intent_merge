import type { BuildSignals } from "./types.js";

function parseParamList(inner: string): string[] {
  const params: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of inner) {
    if (ch === "<" || ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ">" || ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      const name = extractParamName(current);
      if (name) params.push(name);
      current = "";
      continue;
    }
    current += ch;
  }
  const last = extractParamName(current);
  if (last) params.push(last);
  return params;
}

function extractParamName(fragment: string): string | null {
  const t = fragment.trim();
  if (!t) return null;
  const m = t.match(/^([a-zA-Z_$][\w$]*)/);
  return m ? m[1].toLowerCase() : null;
}

function extractReturnInfo(body: string): { keys: string[]; literals: string[] } {
  const keys: string[] = [];
  const literals: string[] = [];
  const retMatch = body.match(/return\s*\{([^}]*)\}/s);
  if (!retMatch) return { keys, literals };
  const inner = retMatch[1];
  const keyRe = /(\w+)\s*:/g;
  let km: RegExpExecArray | null;
  while ((km = keyRe.exec(inner)) !== null) {
    keys.push(km[1].toLowerCase());
  }
  const strRe = /["']([^"']+)["']/g;
  let sm: RegExpExecArray | null;
  while ((sm = strRe.exec(inner)) !== null) {
    literals.push(sm[1].toLowerCase());
  }
  return { keys, literals };
}

export function readBuild(source: string): BuildSignals | null {
  const trimmed = source.trim();
  const exportAsyncFn = trimmed.match(
    /export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/m,
  );
  const exportFn = trimmed.match(
    /export\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/m,
  );
  const exportConstAsync = trimmed.match(
    /export\s+const\s+(\w+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*)\}\s*;?\s*$/m,
  );

  let functionName: string;
  let paramInner: string;
  let body: string;
  let isAsync: boolean;

  if (exportAsyncFn) {
    functionName = exportAsyncFn[1];
    paramInner = exportAsyncFn[2];
    body = exportAsyncFn[3];
    isAsync = true;
  } else if (exportFn) {
    functionName = exportFn[1];
    paramInner = exportFn[2];
    body = exportFn[3];
    isAsync = false;
  } else if (exportConstAsync) {
    functionName = exportConstAsync[1];
    paramInner = exportConstAsync[2];
    body = exportConstAsync[3];
    isAsync = true;
  } else {
    return null;
  }

  const parameters = parseParamList(paramInner);
  const { keys, literals } = extractReturnInfo(body);
  return {
    functionName,
    parameters,
    isAsync,
    returnKeys: keys,
    returnStringLiterals: literals,
    bodySnippet: body.slice(0, 400),
  };
}
