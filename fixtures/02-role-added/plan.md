# Create User

## What this should do

Signup should stay small: collect email and password, persist the user, return enough for the client to continue. Product has floated an optional **role** field for future admin grants, but **this release defers RBAC** — **No roles yet** in the handler or API contract.

## Inputs

- email
- password
- role

## Output

- user account

## Notes for agent

Parameters for the export are named `email`, `password`, and optional `role` in discussion docs only; shipping code must not accept `role` until the plan is updated.
