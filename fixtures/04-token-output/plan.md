# Create User

## What this should do

After successful signup the client needs a **user account** object: stable id, email, and a `type` discriminator the UI can branch on. Security may also mint a short-lived session token in a separate step, but the primary response body for this endpoint must still describe the account, not replace it with token-only data.

## Inputs

- email
- password

## Output

- user account

## Notes for agent

Return shape should include something a client can treat as a persisted **user account**, not only an opaque token string.
