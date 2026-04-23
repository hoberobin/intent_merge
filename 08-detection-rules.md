# Detection Rules

## Goal
Detect only simple, believable mismatches.

## Rule 1: Build input not reflected in plan
If the build contains an obvious input not reflected in the plan, flag a mismatch.

Example:
- plan mentions email and password
- build includes email, password, role

## Rule 2: Plan input missing from build
If the plan clearly expects an input and the build does not contain it, flag a mismatch.

Example:
- plan says email and password
- build only accepts email

## Rule 3: Build output differs materially
If the plan implies one output and the build appears to return something materially different, flag a mismatch.

Example:
- plan implies user account
- build returns token only

## Rule 4: Explicit negative constraint violated
If the plan explicitly says not to include something and the build includes it, flag a clear mismatch.

Example:
- plan says "No roles yet"
- build includes role

## Rule 5: Async or complexity warning
If the plan suggests a very simple direct action and the build clearly becomes async or more deferred, flag a softer mismatch or warning.

Do not overstate confidence here.

## Rule 6: Obvious new concept appears in build
If the build introduces a meaningful concept absent from the plan, flag a likely mismatch.

Examples:
- role
- token
- tenant
- verification code

## Rule 7: Insufficient signal
If the plan is too vague or the build cannot be read clearly, do not guess.
Return "insufficient signal."

## Result types
The MVP only needs three result types:
- aligned
- mismatch
- insufficient signal

If helpful internally, a mismatch can also carry a sublabel such as:
- clear mismatch
- likely mismatch
