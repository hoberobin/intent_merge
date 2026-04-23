# Create User

## What this should do

The signup endpoint must accept **email** and **password** together. Password strength and breach checks run in a shared validator before this handler runs; the handler still needs the password material to derive credentials and persist the auth profile alongside the user row.

## Inputs

- email
- password

## Output

- user account

## Notes for agent

The exported function must be named `createUser` and accept both `email` and `password` parameters.