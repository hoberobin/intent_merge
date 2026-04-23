export type ResultKind = "aligned" | "mismatch" | "insufficient_signal";

export type MismatchStrength = "clear" | "likely";

export interface PlanSignals {
  title: string;
  inputs: string[];
  outputPhrases: string[];
  constraints: string[];
  concepts: string[];
  whatThisShouldDo: string;
  notesForAgent: string;
  raw: string;
}

export interface BuildSignals {
  functionName: string;
  parameters: string[];
  isAsync: boolean;
  returnKeys: string[];
  returnStringLiterals: string[];
  bodySnippet: string;
}

export interface MismatchDetail {
  code: string;
  summary: string;
  strength: MismatchStrength;
}

export interface CompareResult {
  kind: ResultKind;
  mismatches: MismatchDetail[];
  confidenceNote?: string;
}
