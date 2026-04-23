const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_PLAN_CHARS = 12_000;
const MAX_BUILD_CHARS = 32_000;

function stripCodeFence(text: string): string {
  let t = text.trim();
  const fence = /^```(?:typescript|ts|javascript|js)?\s*\n([\s\S]*?)\n```\s*$/m;
  const m = t.match(fence);
  if (m) return m[1].trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[^\n]*\n/, "").replace(/\n```\s*$/, "");
  }
  return t.trim();
}

export type SuggestBuildParams = {
  apiKey: string;
  model?: string;
  planMarkdown: string;
  buildPath: string;
  buildSource: string;
  buildFixPrompt: string;
};

export async function suggestBuildFromOpenAI(params: SuggestBuildParams): Promise<string> {
  const model = params.model?.trim() || process.env.INTENT_MERGE_MODEL?.trim() || DEFAULT_MODEL;
  const plan = params.planMarkdown.length > MAX_PLAN_CHARS
    ? params.planMarkdown.slice(0, MAX_PLAN_CHARS) + "\n\n… (plan truncated for API)"
    : params.planMarkdown;
  const build = params.buildSource.length > MAX_BUILD_CHARS
    ? params.buildSource.slice(0, MAX_BUILD_CHARS) + "\n\n… (build truncated for API)"
    : params.buildSource;

  const user = [
    `Target file: ${params.buildPath}`,
    "",
    "Current plan (markdown):",
    plan,
    "",
    "Current build file source:",
    build,
    "",
    "Instructions from the alignment tool:",
    params.buildFixPrompt,
    "",
    "Return ONLY the complete new contents of the build file (single file).",
    "Valid TypeScript or JavaScript. Preserve the same export style when reasonable.",
    "No markdown fences, no commentary before or after the code.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a careful coding assistant. You output only raw source code for one file — no markdown, no explanation.",
        },
        { role: "user", content: user },
      ],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`OpenAI HTTP ${res.status}: ${detail}`);
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error("OpenAI returned an empty response.");
  }
  return stripCodeFence(String(content));
}
