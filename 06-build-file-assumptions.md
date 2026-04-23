# Build File Assumptions

## Goal
Keep build-file parsing narrow enough to implement quickly and reliable enough to prove the concept.

## Supported build shape
For the MVP, the build file may be assumed to contain one primary exported function.

Examples:
- `export function createUser(...)`
- `export async function createUser(...)`
- `export const createUser = async (...) =>`

## Signals to extract
The build reader should try to extract:
- function name
- parameter names
- async flag
- obvious return cue if present
- obvious concept names found in the function signature or simple function body patterns

## Acceptable limitations
The MVP does not need to fully understand:
- nested implementation details
- complex return objects
- large codebases
- multiple exported targets in one file

## Failure rule
If the build file does not contain a clear primary target, return "insufficient signal" rather than guessing.
