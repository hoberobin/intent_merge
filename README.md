# Intent Merge

CLI that compares **one markdown plan** to **one TypeScript/JavaScript file**, explains gaps in plain language, and helps you **update the plan**, **fix the build** (optional OpenAI draft → edit → apply), or **defer**.

---

## Setup (once)

```bash
npm install && npm run build
```

Run as `node bin/intent-merge.mjs …` from this repo, or `npm link` and use `intent-merge …`.

Optional: copy [`.env.example`](.env.example) → `.env` for `OPENAI_API_KEY` (AI draft on option **2** only). Never put real keys in `.env.example`.

---

## The contract (structure so it “just works”)

Intent Merge is deliberately narrow—**that’s what makes it blend into a workflow** instead of becoming a second codebase to maintain.

| Rule | What it means for you |
|------|------------------------|
| **One plan + one build per run** | Each check is exactly two files. No whole-repo scan. |
| **Default names in one folder** | In a directory, put `plan.md` (or `feature.md`) and `build.ts` (or `index.ts`) together → run `intent-merge check` with **no arguments**. |
| **Other names** | Pass two paths, or use `intent-merge your-plan.md your-file.ts` (the word `check` is optional when the first arg looks like a file). |
| **One main export in the build file** | One primary `export function` / `export async function` / `export const … = async () =>` so the tool knows what to read. |
| **Option 2 artifacts** | Prompts and drafts live in **`.intent-merge/`** next to the **plan** file. Safe to delete; not required for `check` alone. |

If you stay inside this contract, the tool stays predictable. If you need more (monorepo, many exports), run checks **per slice** (separate plan + build pairs) or treat this as a spot-check after an agent edit—not the only quality gate.

---

## Three ways to use it

### 1. Your project folder (simplest day-to-day)

Put `plan.md` and `build.ts` (or `feature.md` / `index.ts`) in the **same directory**, then:

```bash
cd /your/project
intent-merge check
```

No paths. The tool picks up the defaults.

**No files yet?** Create starters, then check:

```bash
intent-merge init
intent-merge check
```

`init` writes a small aligned pair; change the build or plan and run `check` again to explore mismatches. Use `intent-merge init --force` to overwrite.

**Try option [1] (update plan) in this flow**

1. After `init`, edit `build.ts` so it **no longer matches** the plan (e.g. remove `password` from the function signature).
2. Run `intent-merge check` — you should see a **Mismatch**.
3. Choose **1** → read the **preview diff** → confirm **Y** to write the plan, or **n** to skip.

That is the “path 1” loop: **same folder → check → choose 1 → confirm**.

### 2. Built-in demo (no paths, good for learning the loop)

From **this repo** (after `npm run build`):

```bash
npm run demo
# same as:
intent-merge check --demo
```

Uses `fixtures/03-missing-password/` by default (plan expects password, build doesn’t). Try other samples:

```bash
intent-merge check --demo 02
intent-merge check --demo=01
intent-merge demo 05
```

IDs `01`–`06`, or aliases: `aligned`, `roles`, `password`, `token`, `async`, `vague`, or full folder names like `04-token-output`.

### 3. Explicit paths (when filenames differ)

```bash
intent-merge check path/to/plan.md path/to/build.ts
```

You can omit the word `check` if the first argument looks like a file:

```bash
intent-merge ./docs/plan.md ./src/api.ts
```

---

## Lock in every “root path” (automated)

From the repo, after a build:

```bash
npm run test:paths
```

Runs quick **non-interactive** checks: `--demo` (mismatch + aligned), **`init` + check**, **explicit paths** (insufficient), **implicit `check`** (two paths as first args), **same-folder defaults** (`plan.md` + `build.ts` in a temp dir). Use this whenever you change the CLI so all entry paths still behave.

**Comparator-only** (fixtures, no CLI process):

```bash
npm run verify
```

**Reset fixture files + verify** (needs git):

```bash
npm run fixtures:retest
```

---

## After a mismatch: 1, 2, 3

| Key | What it does |
|-----|----------------|
| **1** | Preview diff → confirm → update **plan** file |
| **2** | Save prompt under `.intent-merge/` → optional **OpenAI** draft → edit in `$EDITOR` → confirm → update **build** → re-check |
| **3** | Exit without changes |

**No TTY** (scripts): set `INTENT_MERGE_RESOLUTION=1|2|3` or use `--resolution=2` / trailing `2`.

---

## Maintainer: tests & reset

```bash
npm run verify              # all fixture cases (comparator only)
npm run test:paths          # CLI entry paths (see above)
npm run fixtures:retest     # git-restore fixtures + build + verify
npm run fixtures:reset -- 03-missing-password   # one folder
```

Specs live in `00-README-FIRST.md` … `14-success-criteria.md`. Fixture layout: `fixtures/<id>-<name>/plan.md`, `build.ts`, `expected.md`.

---

## Environment (optional)

| Variable | Use |
|----------|-----|
| `OPENAI_API_KEY` | AI draft when you pick **2** |
| `INTENT_MERGE_MODEL` | Model (default `gpt-4o-mini`) |
| `INTENT_MERGE_HOOK` | Shell to run after prompt file is written |
| `NO_COLOR` | Disable ANSI colors |
| `EDITOR` / `VISUAL` | Open draft (`code --wait` works on macOS/Linux via `sh -c`) |

---

## Security

Do not commit `.env` or real keys in tracked files. GitHub blocks pushes that look like leaked secrets.

Repository: [github.com/hoberobin/intent_merge](https://github.com/hoberobin/intent_merge)
