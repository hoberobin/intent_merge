# Intent Merge — MVP Spec Set (Refined)

This spec set defines a narrow MVP for a plan-vs-build alignment tool for people using AI agents to build products.

## What changed in this refined version
- removed extra conceptual clutter
- tightened the CLI workflow so it is low-overhead
- clarified exactly how the user triggers the tool
- clarified how the tool blends into agent-driven building
- expanded the fixture set into real proof-of-concept test cases
- added expected outcomes so the test loop is easy to verify

## Keep this spec aligned with the implementation (living product)
When the CLI or README changes, update the numbered specs—especially **03** (CLI), **12** (proof loop), **13** (build sequence), **10** (resolution)—so they stay the single source of truth for behavior and testing. Also keep **[docs/agent.md](docs/agent.md)** aligned with shipped flags and resolution behavior so **any AI agent** can run the same ritual as the terminal.

**As implemented (still MVP):** optional **OpenAI**-assisted *draft* of the build file after “Generate build-fix prompt,” only if the user opts in, reviews (including in an editor), and confirms before writing. That is not “autonomous editing” or “advanced AI product features”; the default path remains prompt text + user/agent.

**Surfaces (MVP):** **Terminal CLI** plus **documented agent usage** (copy-paste / Cursor rules). There is **no separate web UI** in scope for this phase.

## MVP in one sentence
Intent Merge is a plain-language tool that compares **one markdown spec** to **one code file**, says **on spec** or **off spec**, and helps you **align the spec or the code**—whether you run it yourself or an AI agent runs the same CLI for you.

## Core user promise
"Show me where my build no longer matches my plan, explain it in plain language, and give me the next prompt or plan update so I can keep building."

## What this spec set is for
This is for building the MVP only.
It excludes:
- roadmap thinking
- advanced AI features
- browser UX
- IDE marketplace extensions (repo-local Cursor rules / agent docs are **in scope** as documentation)
- CI/GitHub workflow
- anything not required to prove the core loop

## Recommended reading order
1. 01-product-definition.md
2. 02-mvp-scope.md
3. 03-cli-experience.md
4. 04-core-workflow.md
5. 05-plan-file-format.md
6. 06-build-file-assumptions.md
7. 07-signal-extraction.md
8. 08-detection-rules.md
9. 09-conflict-presentation.md
10. 10-resolution-actions.md
11. 11-rewrite-rules.md
12. 12-fixtures-and-proof-loop.md
13. 13-build-sequence.md
14. 14-success-criteria.md
