# MVP Scope

## In scope
The MVP supports:
- one markdown plan file
- one JavaScript or TypeScript build file
- one primary exported function target
- simple plan-vs-build alignment checks
- plain-language mismatch presentation (**on spec** / **off spec** headlines by default; technical detail behind `--verbose`)
- plan rewrite when the user chooses "Update plan"
- AI-ready prompt generation when the user chooses "Generate build-fix prompt"
- **`intent-merge setup`** for a one-shot ritual + optional `init`
- **Documented agent path:** portable instructions (`docs/agent.md`) and optional **Cursor rules** so assistants run the **same CLI** as humans

## Comparison dimensions in scope
Only compare these:
- inputs
- output
- explicit plan constraints such as "no roles yet"
- obvious new concepts introduced in the build
- simple async/deferred warning when signal is strong enough

## Out of scope
Do not include:
- browser UI
- packaged IDE extension / marketplace plugin (repo-local Cursor rules are **in scope** as docs only)
- GitHub or CI integration
- autonomous code editing (nothing writes the build **without** explicit user confirmation after review; optional API-generated **drafts** are in scope as a convenience path)
- multi-file reasoning
- complex repository awareness
- deep behavior understanding
- broad semantic interpretation
- support for arbitrary coding languages
- roadmap content in implementation docs

## Narrow technical assumption
The MVP may assume:
- a single plan file and a single build file
- a single exported function or dominant target in the build file
- straightforward parameter extraction from the build file
- lightweight phrase extraction from the plan file

That assumption is acceptable because the MVP is proving the workflow, not solving every parsing problem.
