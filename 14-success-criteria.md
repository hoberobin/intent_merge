# Success Criteria

## Goal
Define what it means for the MVP to prove the concept.

## Success criteria

### 1. Easy to trigger
A user can run the tool with one command and without significant setup overhead (including **same-folder** `plan.md` + `build.ts`, **`check --demo`**, or **`init`** then `check`).

### 2. Understandable output
A non-technical or semi-technical builder can read the result and understand the mismatch without needing code-level language.

### 3. Useful next step
The tool always leaves the user with a clear next move:
- updated plan
- AI prompt to update build
- conscious defer

### 4. Fixture reliability
The fixture set produces believable outcomes across:
- aligned
- mismatch
- insufficient signal

### 5. Workflow fit
The user can imagine running this naturally after an AI agent makes a change.

### 6. Plan rewrite quality
Updated plan files remain readable and useful for future agent prompts.

### 7. Build-fix prompt quality
Generated prompts are strong enough that the user would realistically paste them into a coding agent.

## Failure signs
The MVP is not successful if:
- it feels like a dev utility instead of an alignment assistant
- it requires rigid plan schemas
- it adds too much CLI overhead
- the generated prompt is too weak to use
- the output feels too technical or too uncertain
