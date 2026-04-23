# Rewrite Rules

## Goal
When the user chooses **Update plan** (align the markdown spec), the rewritten plan should remain useful to both the human and the AI agent.

## Rewrite principles
- keep the title
- keep the plan readable
- do not convert the file into a strict machine schema
- only change the parts needed to reflect the chosen alignment
- preserve unrelated notes when possible

## Rewrite strategy
If the original plan includes sections like:
- What this should do
- Inputs
- Output
- Notes for agent

Then update only those relevant sections.

If the original plan is minimal prose, update the prose minimally and naturally.

## Example rewrite

### Before
```md
# Create User

Users should be able to create an account using email and password.
No roles yet.
```

### Build says
- email
- password
- optional role

### After update plan
```md
# Create User

Users should be able to create an account using email and password.
An optional role may also be included during signup.
```

## Important constraint
The rewrite should support the user's existing workflow with agents.
The output must still look like something they would willingly keep as a plan file.
