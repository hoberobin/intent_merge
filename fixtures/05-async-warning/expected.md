# Expected

Result type: mismatch or likely mismatch

Expected mismatch summary:
- the build appears async or queued
- the plan suggests a simpler direct action

Important note:
- wording should stay cautious
- the tool should not pretend it fully understands behavior

If Update plan:
- plan can be updated to reflect queued/async sending

If Generate build-fix prompt:
- prompt can ask the agent to keep the action immediate/simple if that is still intended
