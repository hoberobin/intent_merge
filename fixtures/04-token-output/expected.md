# Expected

Result type: mismatch

Expected mismatch code:

- `output_token_vs_account` — plan output centers on a user account; build returns token-only shape

If Update plan:

- plan should be updated to describe token-first or session-only responses

If Generate build-fix prompt:

- prompt should ask the agent to return a user account (or equivalent fields), not token-only output
