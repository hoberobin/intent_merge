# Intent Merge

**Intent Merge** is a small CLI that compares a **markdown plan** to a **single TypeScript/JavaScript build file**, explains mismatches in plain language, and helps you either **update the plan**, **fix the build** (including an optional **OpenAI draft** you can edit before applying), or **defer**.

It is meant to feel like a quick alignment check while you work with coding agents—not a linter or deep static analyzer.

---

## Requirements

- **Node.js 18+**
- **Git** (recommended) — used by `npm run fixtures:reset` to restore fixture files
- **OpenAI** (optional) — only if you want the AI-assisted draft when you choose option **2**

---

## Install and build

From the repository root:

```bash
npm install
npm run build
```

Run the CLI **without** installing globally:

```bash
node bin/intent-merge.mjs check <plan.md> <build.ts>
```

Optional: put the command on your `PATH`:

```bash
npm link
intent-merge check plan.md build.ts
```

The CLI loads **`<repo>/.env`** automatically (via `dotenv`). Copy [`.env.example`](.env.example) to `.env` and add secrets there—**never commit `.env`** (it is gitignored).

---

## Daily usage: `intent-merge check`

### Explicit paths (recommended)

```bash
node bin/intent-merge.mjs check path/to/plan.md path/to/build.ts
```

### Guided mode (defaults in the **current working directory**)

```bash
cd /path/to/your/feature
node /path/to/intent_merge/bin/intent-merge.mjs check
```

The tool looks for, in order:

| Role   | Default filenames tried      |
|--------|------------------------------|
| Plan   | `plan.md`, then `feature.md` |
| Build  | `build.ts`, then `index.ts`  |

If a default is missing, you are prompted to type paths.

### Pass resolution without prompts (automation / scripts)

You can skip the interactive menu in any of these ways:

```bash
# Environment variable
INTENT_MERGE_RESOLUTION=2 node bin/intent-merge.mjs check plan.md build.ts

# Flag
node bin/intent-merge.mjs check plan.md build.ts --resolution=2
node bin/intent-merge.mjs check plan.md build.ts -r 2

# Trailing digit (must be last argument)
node bin/intent-merge.mjs check plan.md build.ts 2
```

Values: **`1`** = update plan, **`2`** = build-fix flow, **`3`** = decide later.

**Important:** Options **1** and **2** are most useful in a **real terminal** (TTY). If stdin is not a TTY, the tool explains how to set `INTENT_MERGE_RESOLUTION` instead of hanging or guessing.

---

## After a mismatch: what 1, 2, and 3 do

When the result is **mismatch**, you see a structured summary (plan vs build, why it matters, details). Then:

| Choice | Name | What happens (interactive) |
|--------|------|-----------------------------|
| **1** | Update plan | Shows a **diff preview** of the rewritten plan, then asks **Write this to the plan file? [Y/n]** before saving. |
| **2** | Generate build-fix prompt | Saves the prompt under **`<plan-dir>/.intent-merge/build-fix.prompt.md`**, prints it, copies to clipboard when possible. If **`OPENAI_API_KEY`** is set, asks whether to **generate an AI draft** of the build, shows a **colored diff**, can **open the draft in `$EDITOR`/`$VISUAL`**, then asks **Apply to the real build file? [y/N]**. After you apply (or edit the build yourself), you can **re-check alignment** in the same run. |
| **3** | Decide later | No file changes; short reminder that alignment is still open. |

**Non-interactive** option **2** (e.g. `INTENT_MERGE_RESOLUTION=2` without a TTY): writes the prompt file and prints the prompt; it does **not** run the editor / re-check loop.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enables the optional **OpenAI draft** step after choosing **2**. Set in `.env` in the repo root. |
| `INTENT_MERGE_MODEL` | OpenAI model for the draft (default: `gpt-4o-mini`). Optional. |
| `INTENT_MERGE_RESOLUTION` | `1`, `2`, or `3` — skip the interactive choice when set. |
| `INTENT_MERGE_HOOK` | Shell command run after the prompt file is written (option **2**). If set, you are asked before running. The child process receives `INTENT_MERGE_PROMPT_FILE`, `INTENT_MERGE_PLAN_FILE`, `INTENT_MERGE_BUILD_FILE`. |
| `NO_COLOR` | Set to any value to **disable ANSI colors** in the terminal. |
| `EDITOR` / `VISUAL` | Editor used to open the AI draft (Unix: run as `sh -c "$EDITOR <file>"`, so values like `code --wait` work). |

---

## Testing the project (fixtures + verify)

The **fixtures** under `fixtures/` are small `plan.md` + `build.ts` pairs with documented expectations. They are the fastest way to prove the core loop.

### 1. Automated comparator check (no prompts)

```bash
npm run build
npm run verify
```

You should see `ok` for all six cases (`01-aligned` … `06-vague-plan`). This only exercises **compare** + expected result types—not the full interactive resolution flow.

### 2. Full CLI on one fixture (interactive)

Use a **real terminal** (Terminal.app, iTerm, Cursor integrated terminal). When you see **Your choice (1 / 2 / 3):**, type **one digit** and press **Enter** while the program is still running—not on the shell prompt after it exits.

```bash
npm run build
node bin/intent-merge.mjs check fixtures/03-missing-password/plan.md fixtures/03-missing-password/build.ts
```

### 3. Safe place to hammer option 1 / 2 / OpenAI

Copy a fixture elsewhere so you do not mutate the repo’s canonical files:

```bash
cp -R fixtures/03-missing-password ~/Desktop/im-demo
cd ~/Desktop/im-demo
node /path/to/intent_merge/bin/intent-merge.mjs check plan.md build.ts
```

### 4. Reset fixtures to the last git commit

After you change `plan.md`, `build.ts`, or create `.intent-merge/` under fixtures, reset:

```bash
# All fixtures
npm run fixtures:reset

# One folder only (name under fixtures/)
npm run fixtures:reset -- 03-missing-password
```

Requires a **git** checkout. If there is no `.git`, the script only removes `fixtures/**/.intent-merge/` and tells you to restore files manually.

### 5. One command: reset + build + verify

```bash
npm run fixtures:retest
```

Use this before a PR or whenever you want a clean baseline.

---

## Where artifacts go

| Path | When |
|------|------|
| `<plan-directory>/.intent-merge/build-fix.prompt.md` | After option **2** |
| `<plan-directory>/.intent-merge/build.proposed.ts` (or `.js`) | After an OpenAI draft (option **2**) |

These directories are gitignored (`**/.intent-merge/`). `fixtures:reset` deletes them under the path you reset.

---

## Development commands

| Command | Meaning |
|---------|---------|
| `npm run build` | Compile `src/` → `dist/` |
| `npm run dev` | Run CLI via `tsx` without a separate build |
| `npm run verify` | Run fixture assertions against `dist/compare.js` |
| `npm run fixtures:reset` | Git-restore fixture files + remove `.intent-merge` |
| `npm run fixtures:retest` | `fixtures:reset` + `build` + `verify` |

---

## Troubleshooting

- **`zsh: command not found: 2`** — You typed `2` at the **shell** after the program already exited. Run the command again and answer **at the `Your choice` prompt** inside the same run, or use `--resolution=2` / trailing `2`.
- **`verify` fails on a fixture you did not touch** — Another run may have changed that fixture on disk. Run `npm run fixtures:reset -- <folder-name>` then `npm run verify` again.
- **No colors** — Expected if `NO_COLOR` is set or stdout is not a TTY.
- **OpenAI errors** — Check the key, billing, and model name; errors are printed without echoing the key.

---

## Spec and fixtures

- Numbered markdown specs (`00-README-FIRST.md` … `14-success-criteria.md`) describe product behavior.
- Each `fixtures/<name>/` has `plan.md`, `build.ts`, and `expected.md` describing the intended outcome.

---

## Security

- **Do not commit API keys.** Use `.env` locally only; rotate any key that was ever pasted into chat or a ticket.
- **Never put real secrets in `.env.example`** — only placeholders. GitHub push protection will block the push if a key appears in tracked files.
- The tool **does not** send your plan or build to OpenAI unless you choose option **2** and confirm the AI draft step.

If something in this README drifts from the code, search the repo for `INTENT_MERGE_`, `fixtures:reset`, and `parseCheckRest` in [`src/cli.ts`](src/cli.ts) / [`src/resolve.ts`](src/resolve.ts) for the source of truth.
