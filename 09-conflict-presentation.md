# Conflict Presentation

## Goal
Make mismatch output understandable to someone building with agents, not just to a developer reading code.

## Required structure
When a mismatch is found, show:

1. title
2. what the plan says
3. what the build now appears to do
4. why this matters
5. what the user can do next

## Example

```text
We found a mismatch in "Create User"

Your plan says:
- users sign up with email and password
- roles are not included yet

Your build now appears to include:
- email
- password
- optional role

Why this matters:
- your plan and build may now be telling the AI two different stories
- future prompts may rely on the wrong source of truth

What would you like to do?
[1] Update plan
[2] Generate build-fix prompt
[3] Decide later
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
