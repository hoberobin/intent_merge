# Conflict Presentation

## Goal
Make mismatch output understandable to someone building with agents, not just to a developer reading code.

## Required structure
When a mismatch is found, show:

1. headline (**Off spec** by default; **Mismatch** / full technical block with `--verbose`)
2. what the spec is asking for (plan-derived bullets)
3. what diverged (comparator summaries)
4. (optional `--verbose`) what the build appears to do (signature / return-shape hints)
5. why this matters
6. what the user can do next (plain-language choices + numeric shortcuts)

## Example

```text
Off spec

Your markdown spec and implementation file do not line up — 1 finding.

What your spec is asking for
  - …

What diverged
  - …

Technical detail about the implementation file is available with --verbose.

What would you like to do next?
  [1]  Update the markdown spec to match the code
  [2]  Get a prompt you can paste into an AI to fix the code
  [3]  Decide later
```

## Copy rules
Use:
- plan
- build
- mismatch
- alignment
- update plan
- generate build-fix prompt

Avoid:
- contract drift
- parameter mismatch
- AST diff
- violation

## Confidence rule
If the signal is weak, say so.
The tool should be plain and honest, not overconfident.
