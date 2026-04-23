# CLI Experience

## Goal
The CLI must feel fast, forgiving, and low-overhead.

The user should not need to memorize many commands or manage a bunch of setup.

## Primary entry points

### Option A — Explicit file paths
```bash
intent-merge check plan.md build.ts
```

Use this when the user wants direct control. If the first argument looks like a file (e.g. ends in `.md` / `.ts`), the word **`check`** may be omitted: `intent-merge plan.md build.ts`.

### Option B — Same-folder defaults (guided mode)
```bash
intent-merge check
```

If the user omits paths, the tool should:
1. look for likely defaults such as `plan.md`, `feature.md`, `build.ts`, `index.ts`
2. if both are missing, show a **short hint** first (`init` to create starters, or `check --demo` to run a built-in sample), then only if still needed prompt the user to choose files interactively

### Option C — Built-in demo (no paths, low friction for learning)
```bash
intent-merge check --demo
intent-merge check --demo 03
intent-merge demo
```

Runs a packaged fixture from the tool install (default sample: missing-password). Accepts short ids (`01`–`06`), aliases (e.g. `roles`, `token`), or full folder names under `fixtures/`.

### Option D — Starter files in the current directory
```bash
intent-merge init
```

Creates `plan.md` and `build.ts` in the working directory so the user can run **`intent-merge check`** immediately without copying repo paths. Use `init --force` only to overwrite existing files.

## Why this matters
A big part of this product is reducing friction.
If running the tool feels like setup work, users will skip it.

## Recommended CLI behavior
After a mismatch is shown, the next action should happen in the same session.

The user should not need a second command to resolve the issue.

## Resolution choices in the CLI
Use this wording:
- Update plan
- Generate build-fix prompt
- Decide later

## Low-overhead requirement
The CLI should work well for a user who only does this:
1. writes a plan file
2. asks an AI agent to build
3. runs `intent-merge check`
4. reads the result
5. copies the generated prompt or accepts the updated plan

That is the experience the MVP must optimize for.
