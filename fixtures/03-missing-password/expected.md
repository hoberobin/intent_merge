# Expected

Result type: mismatch

Expected mismatch summary:

- the plan expects email and password
- the build only appears to use email

If Update plan:

- plan may be rewritten to remove password only if user decides build is correct

If Generate build-fix prompt:

- prompt should ask the agent to restore password support in signup