# Signal Extraction

## Goal
Extract enough signal to compare plan and build without pretending to deeply understand the entire system.

## Plan signals
Extract:
- title
- named inputs from bullet lists if present
- output phrases from an Output section if present
- negative constraints such as:
  - no roles yet
  - do not add extra fields
  - keep this simple
- meaningful nouns and concepts from the prose

## Build signals
Extract:
- function name
- parameter names
- async flag
- simple return cue when possible
- obvious concept names from parameters and shallow body inspection

## Normalized internal shape
The exact implementation is up to the builder, but the comparison layer should normalize to something close to:

- title
- inputs[]
- outputs[]
- constraints[]
- concepts[]
- async_flag
- confidence_notes[]

## Important principle
The normalized shape can be technical internally.
The user should not see this shape directly unless you choose to expose it in a debug mode later.
