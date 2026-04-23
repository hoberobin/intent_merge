# Intent Merge

**One markdown spec. One code file. Run a check: you are either on spec or off spec—then align the spec or the code in plain language.**

No web UI: you use the **terminal** or any **AI agent** (Cursor, Copilot, …) that runs the **same** commands documented here and in [docs/agent.md](docs/agent.md).

---

## Fastest way to try it

**Published package (when available on npm):**

```bash
npx intent-merge@latest check --demo
```

**From this repository:**

```bash
npm install && npm run build
node bin/intent-merge.mjs check --demo
```

Or `npm link` and run `intent-merge …` globally.

Optional: copy [`.env.example`](.env.example) → `.env` for `OPENAI_API_KEY` (AI draft when you pick option **2** after a mismatch). Never put real keys in `.env.example`.

---

## Use with an AI agent

Point your agent at [docs/agent.md](docs/agent.md). It lists **verbatim** `intent-merge` commands, `--resolution` for non-TTY runs, and what not to invent.

In **Cursor**, the repo includes [`.cursor/rules/intent-merge.mdc`](.cursor/rules/intent-merge.mdc): mention the rule or ask to “run Intent Merge” so the agent shells out to the CLI instead of guessing alignment.

---

## The contract (so it “just works”)

Intent Merge stays **narrow** on purpose.

| Rule | What it means for you |
|------|------------------------|
| **One spec + one build per run** | Exactly two files. No whole-repo scan. |
| **Default names in one folder** | Put `plan.md` (or `feature.md`) and `build.ts` (or `index.ts`) together → `intent-merge check` with **no arguments**. |
| **Other names** | Pass two paths, or `intent-merge your-spec.md your-file.ts` (`check` is optional when the first arg looks like a file). |
| **One main export** | One primary `export function` / `export async function` / `export const … = async () =>` in the build file. |
| **Option 2 artifacts** | Prompts live under **`.intent-merge/`** next to the spec. Safe to delete; not required for `check` alone. |

Need more coverage? Run **separate** checks per slice (another spec + another file), or use this after an agent edit—not as your only quality gate.

---

## Three ways to use it

### 1. Your folder (day-to-day)

```bash
cd /your/project
intent-merge check
```

**Nothing there yet?**

```bash
intent-merge setup          # creates plan.md + build.ts if missing, prints the ritual
# or
intent-merge init
intent-merge check
```

**Technical detail** (signatures, return-shape hints): add `--verbose` / `-v`.

**Try aligning after a mismatch**

1. After `init`, edit `build.ts` so it **no longer matches** the spec (e.g. remove `password` from the function).
2. Run `intent-merge check` — you should see **Off spec**.
3. Choose **1** (or say “update the spec”) → preview diff → **Y** to write the markdown, or **n** to skip.

### 2. Built-in demo (no files required)

```bash
npm run demo
# same as:
intent-merge check --demo
```

Default sample: `fixtures/03-missing-password/`. Others: `intent-merge check --demo 02`, IDs `01`–`06`, aliases (`aligned`, `roles`, …).

### 3. Explicit paths

```bash
intent-merge check path/to/spec.md path/to/build.ts
intent-merge ./docs/spec.md ./src/api.ts
```

---

## Deeper sample (manual stress)

Large spec + large single-file implementation in **`examples/billing-checkout-session`**. The pair is **intentionally off spec** (the spec lists **locale** under `## Inputs`; `build.ts` omits that parameter) so you always get **Off spec** and can practice the resolution loop.

```bash
cd examples/billing-checkout-session
intent-merge check
```

**Back to on spec:** add `locale: string` (and validation) back to `createCheckoutSession`, and list `locale` in **Notes for agent** again if you edit that section — or choose option **1** in the tool to have the spec follow the code.

**Extra drill:** remove a different input bullet or parameter, run `check` again, then walk through choices.

---

## Lock in every “root path” (automated)

```bash
npm run test:paths
```

Non-interactive smoke: `--demo` (off spec + on spec), **`init` + check**, **explicit paths** (insufficient), **implicit two-arg check**, **same-folder defaults**, **`setup` in an empty dir**.

```bash
npm run verify
```

Comparator-only fixtures (also asserts mismatch **codes**).

```bash
npm run fixtures:retest
```

Reset fixture files from git + build + verify.

---

## After a mismatch

| Choice | Plain language | What it does |
|--------|----------------|--------------|
| **1** | Update the markdown spec | Preview diff → confirm → write **plan** |
| **2** | Get a prompt to fix the code | Save prompt under `.intent-merge/` → optional **OpenAI** draft → edit → confirm → write **build** → re-check |
| **3** | Decide later | No changes |

You can type phrases like **“update the spec”**, **“fix the code”**, or **“later”** instead of digits when running interactively.

**No TTY:** `INTENT_MERGE_RESOLUTION=1|2|3` or `--resolution=2` (see [docs/agent.md](docs/agent.md)).

---

## Maintainer: tests & reset

```bash
npm run verify
npm run test:paths
npm run fixtures:retest
npm run fixtures:reset -- 03-missing-password
```

Canon specs: `00-README-FIRST.md` … `14-success-criteria.md`. Fixtures: `fixtures/<id>-<name>/plan.md`, `build.ts`, `expected.md`.

---

## Environment (optional)

| Variable | Use |
|----------|-----|
| `OPENAI_API_KEY` | AI draft when you pick **2** |
| `INTENT_MERGE_MODEL` | Model (default `gpt-4o-mini`) |
| `INTENT_MERGE_HOOK` | Shell to run after prompt file is written |
| `NO_COLOR` | Disable ANSI colors |
| `EDITOR` / `VISUAL` | Open draft |

---

## Security

Do not commit `.env` or real keys in tracked files.

Repository: [github.com/hoberobin/intent_merge](https://github.com/hoberobin/intent_merge)
