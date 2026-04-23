# Fixtures and Proof Loop

## Goal
Make the proof of concept easy to test, not just conceptually valid.

The fixture set must let the builder run through the full loop repeatedly:
- compare
- detect
- decide
- rewrite plan or generate prompt

## Fixture folders
Use this exact shape:

```text
fixtures/
  01-aligned/
    plan.md
    build.ts
    expected.md
  02-role-added/
    plan.md
    build.ts
    expected.md
  03-missing-password/
    plan.md
    build.ts
    expected.md
  04-token-output/
    plan.md
    build.ts
    expected.md
  05-async-warning/
    plan.md
    build.ts
    expected.md
  06-vague-plan/
    plan.md
    build.ts
    expected.md
```

## What each expected.md should contain
- expected result type
- expected plain-language mismatch summary
- expected likely resolution options
- notes on what should happen if the user picks Update plan
- notes on what should happen if the user picks Generate build-fix prompt

## Fixture 1 — aligned
Expected result:
- aligned

Purpose:
- confirm the tool can identify a clean match and avoid noise

## Fixture 2 — role added
Expected result:
- mismatch

Purpose:
- confirm the tool catches a new concept and an explicit "no roles yet" conflict

## Fixture 3 — missing password
Expected result:
- mismatch

Purpose:
- confirm the tool catches a plan-required input missing from the build

## Fixture 4 — token output
Expected result:
- mismatch

Purpose:
- confirm the tool catches a materially different output

## Fixture 5 — async warning
Expected result:
- mismatch or softer likely mismatch

Purpose:
- confirm the tool can surface a simpler-vs-more-deferred flow difference without sounding overconfident

## Fixture 6 — vague plan
Expected result:
- insufficient signal

Purpose:
- confirm the tool avoids guessing when the plan is too loose

## Proof loop commands
These are the commands the builder should be able to run immediately.

**Fast path (from repo, no paths):** packaged demos use the same files as the fixtures:

```bash
npm run build
npm run demo
# same as: intent-merge check --demo   (default: 03-missing-password)
intent-merge check --demo 02
```

**Explicit paths** (always valid for CI or when not using `--demo`):

```bash
intent-merge check fixtures/01-aligned/plan.md fixtures/01-aligned/build.ts
intent-merge check fixtures/02-role-added/plan.md fixtures/02-role-added/build.ts
intent-merge check fixtures/03-missing-password/plan.md fixtures/03-missing-password/build.ts
intent-merge check fixtures/04-token-output/plan.md fixtures/04-token-output/build.ts
intent-merge check fixtures/05-async-warning/plan.md fixtures/05-async-warning/build.ts
intent-merge check fixtures/06-vague-plan/plan.md fixtures/06-vague-plan/build.ts
```

**Comparator-only regression** (no interactive resolution):

```bash
npm run verify
```

This asserts each fixture’s result kind and, for mismatch fixtures, the exact mismatch `code` values from `comparePlanBuild` (so comparator changes do not silently swap one mismatch for another).

**CLI entry paths** (defaults, `--demo`, `init`, `setup`, explicit paths; no prompts):

```bash
npm run test:paths
```

`verify` also asserts **mismatch `code` values** for each mismatch fixture (stable comparator regression).

**Reset tracked fixture files to git HEAD and remove `.intent-merge/` artifacts** (requires git):

```bash
npm run fixtures:reset
npm run fixtures:retest
```

## Proof standard
The concept is worth continuing if these fixtures make the alignment loop feel:
- understandable
- useful
- easy to act on
- low-friction
