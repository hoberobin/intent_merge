# Expected

Result type: aligned

Expected message:

- no meaningful mismatch found

Why:

- plan inputs match build parameters (`email`, `password`)
- return shape still reads as a user account (`type: "user account"`), not token-only output
- prose is longer than the minimal fixture, but the structured Inputs/Output sections still line up with the export
