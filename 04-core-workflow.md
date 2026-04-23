# Core Workflow

## Goal
The workflow must feel like a plain-language merge review between what the user intended and what the build now does.

## Workflow
1. User runs `intent-merge check` with explicit paths or guided mode.
2. Tool reads the plan file.
3. Tool reads the build file.
4. Tool extracts lightweight signals from both.
5. Tool compares those signals.
6. Tool returns one of three states:
   - aligned (**On spec** in default user-facing copy)
   - mismatch found (**Off spec** in default user-facing copy)
   - insufficient signal (**Not enough signal to compare** in default user-facing copy)
7. If mismatch found, tool explains:
   - what the plan says
   - what diverged (plain-language bullets)
   - (optional) what the build appears to do — **full technical detail only with `--verbose`**
   - why the difference matters
8. Tool offers resolution choices:
   - Update the markdown spec (to match the code)
   - Generate build-fix prompt (to change the code)
   - Decide later
9. Tool either rewrites the plan, generates a copy-paste-ready AI prompt, and/or (when the user opts in and confirms) suggests an updated build file via an external model—still with **human review** before any build write—or the user defers.

## Desired feel
The user should feel:
- informed quickly
- not overwhelmed
- able to act immediately
- still in control of which side is correct

## Required principle
The tool should never act like it already knows which side is right.
It should surface the mismatch and let the user choose the source of truth.
