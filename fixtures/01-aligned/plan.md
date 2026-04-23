# Create User

## What this should do

The signup API should create a tenant-scoped user record from credentials the client already validated at the edge. This handler assumes duplicate email checks and rate limiting ran upstream. It persists the identity and returns a minimal account envelope so the client can continue onboarding without a second round trip.

## Inputs

- email
- password

## Output

- user account

## Notes for agent

Primary export: `createUser` with parameters `email` and `password`.
