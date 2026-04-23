# Expected

Result type: mismatch

Expected mismatch code:

- `negative_constraint_roles` — plan forbids roles for now; build still accepts `role`

Expected user choices:

- Update plan
- Generate build-fix prompt
- Decide later

If Update plan:

- plan should be rewritten to allow optional `role`, and the “No roles yet” constraint removed or revised

If Generate build-fix prompt:

- prompt should ask the agent to remove `role` handling until RBAC ships
