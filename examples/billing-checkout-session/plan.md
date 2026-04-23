# Create hosted checkout session

## What this should do

Product and billing teams need a way to send a customer to a hosted payment page without building a custom card form. The flow should create a server-side checkout session tied to an existing customer record and a specific recurring price. After payment, the customer lands on a success URL we control; if they abandon the flow, they return via the cancel URL.

When a trial is offered, the hosted page should show the trial length in days before any charge. All calls must be safe to retry: the same logical request may arrive twice with the same idempotency key, and the second attempt should not create a duplicate session. Optional structured metadata is forwarded to the billing provider for reconciliation and analytics.

## Inputs

- customer id
- price id
- success url
- cancel url
- trial days
- metadata
- idempotency key

## Output

- checkout session url
- session id
- expires at

## Notes for agent

The exported entry point is `createCheckoutSession` with parameters named `customerId`, `priceId`, `successUrl`, `cancelUrl`, `trialDays`, `metadata`, and `idempotencyKey`, matching the Inputs list above.