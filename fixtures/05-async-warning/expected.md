# Expected

Result type: mismatch (soft / likely-strength signal)

Expected mismatch code:

- `async_or_deferred` — plan reads immediate/simple; build is async and returns a queued status

Important note:

- wording should stay cautious; the tool should not pretend it fully understands runtime behavior

If Update plan:

- plan can be updated to reflect queued or async sending

If Generate build-fix prompt:

- prompt can ask the agent to keep delivery immediate if that is still the product intent
