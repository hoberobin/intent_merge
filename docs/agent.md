# Using Intent Merge from an AI agent (Cursor, Copilot, etc.)

This document is for **any assistant** helping a human keep a **markdown spec** and **one implementation file** aligned. Do **not** invent mismatch rules or guess file contents—run the same CLI a human would run.

## What the tool does (one sentence)

It compares **one** `.md` spec to **one** `.ts`/`.js` file with a single primary export, then says **on spec** or **off spec** and can help **update the spec** or **produce a prompt to fix the code**.

## Before you run anything

1. Resolve **absolute or repo-relative paths** to the spec and the code file (or confirm the user’s cwd contains default names `plan.md` + `build.ts` or `feature.md` + `index.ts`).
2. Prefer **`npx intent-merge@latest`** if the package is published; from a clone use `node path/to/bin/intent-merge.mjs` after `npm run build`.

## Commands to run (verbatim patterns)

Check with explicit paths:

```bash
intent-merge check path/to/spec.md path/to/implementation.ts
```

Same check with technical detail (signatures, return shape hints):

```bash
intent-merge check --verbose path/to/spec.md path/to/implementation.ts
```

Check using defaults in the current directory:

```bash
cd path/to/folder
intent-merge check
```

Built-in sample (no user files required):

```bash
intent-merge check --demo
```

Quick start for an empty folder (creates starters if missing, prints the ritual):

```bash
intent-merge setup
```

## Non-interactive runs (agent in a sandbox / no TTY)

When stdin is not a TTY, the tool will **not** prompt. Set a resolution **before** or **after** the subcommand:

```bash
intent-merge check --resolution=3 path/to/spec.md path/to/implementation.ts
```

Or:

```bash
INTENT_MERGE_RESOLUTION=3 intent-merge check path/to/spec.md path/to/implementation.ts
```

Meaning of `INTENT_MERGE_RESOLUTION` / `--resolution`:

| Value | Meaning |
|-------|---------|
| `1` | Apply **update the markdown spec** flow (preview/confirm when interactive). |
| `2` | Write the **build-fix prompt** under `.intent-merge/` next to the spec; do not silently rewrite code unless the human applies it. |
| `3` | **Defer**—report only. |

Do **not** pass `1` in automation unless the human explicitly asked to rewrite the spec without review.

## What you should report back to the human

- If output starts with **On spec** or **Off spec** (or verbose **Mismatch**), quote that headline and the **“What diverged”** bullets in plain language.
- If output says **Not enough signal to compare**, tell them to add `## Inputs` and `## Output` to the markdown spec (see repo spec `05-plan-file-format.md`).

## Do not

- Do not claim the repo was “fully audited” unless `intent-merge` was actually run on each spec/build pair.
- Do not fabricate mismatch codes; they come only from the CLI output.
- Do not split the implementation across multiple files for this tool—**one** primary export per check.

## Deeper manual stress example

From the Intent Merge repository root:

```bash
cd examples/billing-checkout-session
intent-merge check
```

This sample ships **off spec on purpose** (spec includes **locale** in `## Inputs`; `build.ts` omits the `locale` parameter) so you can run the mismatch loop without editing files first. To **re-align**, add `locale` back to the export (and optionally update **Notes for agent**), or use option **1** to rewrite the spec to match the code.
