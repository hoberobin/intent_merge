# CLI Experience

## Goal
The CLI must feel fast, forgiving, and low-overhead.

The user should not need to memorize many commands or manage a bunch of setup.

## Primary entry points

### Option A — Explicit file paths
```bash
intent-merge check plan.md build.ts
```

Use this when the user wants direct control.

### Option B — Guided mode
```bash
intent-merge check
```

If the user omits paths, the tool should:
1. look for likely defaults such as `plan.md`, `feature.md`, `build.ts`, `index.ts`
2. if not found, prompt the user to choose files interactively

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
