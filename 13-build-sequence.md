# Build Sequence

## Goal
Build the MVP in the smallest believable order.

## Step 1: Create fixture files
Build the fixture set first.
This prevents the project from drifting into abstract design work.

## Step 2: Build plan reader
Extract:
- title
- inputs
- output terms
- explicit constraints
- concepts

## Step 3: Build build reader
Extract:
- function name
- parameters
- async flag
- basic output cue
- obvious concepts

## Step 4: Build comparator
Implement only the rules in `08-detection-rules.md`.

## Step 5: Build presenter
Turn comparator output into plain-language aligned / mismatch / insufficient signal responses.

## Step 6: Build resolver
Support:
- Update the markdown spec (Update plan)
- Generate build-fix prompt
- Decide later

## Step 7: Test the full loop
For each fixture:
- run the command
- confirm the expected result type
- confirm the wording feels readable
- confirm “update the spec” / Update plan changes the plan sensibly
- confirm Generate build-fix prompt creates a usable prompt

## Step 8: Tighten only where needed
Only improve:
- extraction
- wording
- resolution usefulness
- CLI smoothness

Do not add new scope before the fixture loop feels good.

## Step 9: Keep specs and README aligned with the shipped CLI (ongoing)
Whenever behavior changes (new flags, scripts, optional OpenAI path, `init` / `setup` / `--demo` / `--verbose`, etc.), update:
- **03-cli-experience.md**, **04-core-workflow.md**, **10-resolution-actions.md**, **12-fixtures-and-proof-loop.md**, and **00-README-FIRST.md** if scope wording shifts
- **README.md** in the repo for day-to-day contributors

Run **`npm run verify`**, **`npm run test:paths`**, and **`npm run fixtures:retest`** after substantive changes.
