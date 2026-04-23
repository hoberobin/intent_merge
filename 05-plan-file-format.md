# Plan File Format

## Goal
The plan file should be easy for a non-technical builder to write and easy for an AI agent to understand.

It should not require rigid schemas.

## Recommended structure

```md
# Create User

## What this should do
Users should be able to create an account using email and password.
Keep this simple. No roles yet.

## Inputs
- email
- password

## Output
- user account

## Notes for agent
Do not add extra signup fields unless requested.
```

## Minimum valid plan
The MVP should accept a very small plan like:

```md
# Create User

Users should be able to create an account using email and password.
No roles yet.
```

## Parsing priority
The plan reader should prioritize these sections in this order:
1. Inputs
2. Output
3. What this should do
4. Notes for agent
5. title

## Important product rule
Do not force the user to write YAML, JSON, or a strict contract block for the MVP.

## Notes for agent (recommended for richer specs)
When inputs use natural phrases (**customer id**) but the code uses **camelCase** (`customerId`), add a short **Notes for agent** block that names the exact parameter identifiers. That keeps automated checks **on spec** without forcing bullets to read like code.

## Rewrite requirement
If the user chooses "Update plan," the rewritten file should stay readable and should continue to look like a real plan file, not a machine schema dump.
