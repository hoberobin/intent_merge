# Resolution Actions

## Goal
Help the user take the next step immediately without leaving the flow.

## Action 1: Update plan
Use this when the build is correct and the plan should catch up.

Behavior:
- rewrite the plan in plain language
- preserve title and unrelated notes where possible
- add or adjust the relevant input/output/constraint lines
- keep the file readable and useful for future AI prompts

## Action 2: Generate build-fix prompt
Use this when the plan is still correct and the build should change.

Behavior:
- do not edit code automatically
- generate a plain-language prompt the user can paste into their coding agent
- the prompt must clearly state:
  - what the plan intends
  - what the build currently appears to do
  - what needs to change

## Action 3: Decide later
Use this when the user wants to keep moving without resolving the mismatch now.

Behavior:
- do not change anything
- print a short reminder that alignment remains unresolved

## Generated prompt shape
A valid build-fix prompt should look like this:

```text
Please update the implementation of Create User to match the current plan.

Plan intent:
- users should sign up with email and password
- roles should not be included yet

Current build mismatch:
- the implementation includes an optional role field

Requested change:
- remove role handling from signup
- keep the flow limited to email and password
- preserve current behavior otherwise
```
