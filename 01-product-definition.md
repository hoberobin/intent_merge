# Product Definition

## Product name
Intent Merge

## Product category
Alignment assistant for people building with AI agents.

## Product definition
Intent Merge is a low-overhead CLI tool that checks whether a user's plan file and current build still appear aligned.

If they do not align, it shows **off spec** in plain language and offers three actions:
1. Update the markdown spec (to match the code)
2. Generate a build-fix prompt (for an AI to change the code)
3. Decide later

## Product perspective
This should not feel like a developer lint rule.
This should not feel like static analysis software.
This should feel like a quick alignment check for someone collaborating with an AI agent.

## User-facing mental model
- plan = what I meant to build
- build = what currently exists
- intent merge = helping me decide which side should change

## Product promise
The user should be able to run the tool quickly, read the result quickly, and continue their workflow without getting dragged into technical details unless they want them (use **`intent-merge check --verbose`** for signature-level detail).

The same commands are documented for **AI agents** in `docs/agent.md` so “run the check” is repeatable outside the terminal.
