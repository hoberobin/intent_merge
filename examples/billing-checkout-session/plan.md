# Create hosted checkout session

## What this should do

Product and finance need a **hosted checkout** path so customers can pay without our app ever touching raw card numbers. The server creates a **billing-provider checkout session** tied to an existing **customer id** and a **recurring price id**, then returns a **URL** the client opens in a browser or webview. After success the customer lands on our **success url**; if they abandon, they return via **cancel url**.

**Trials:** When **trial days** is set, the hosted page must show how long the trial runs before the first charge. When it is omitted, charge on the first successful payment per provider rules.

**Idempotency:** The same logical request may arrive twice (retries, double-clicks). The **idempotency key** must be stable per user intent so we never create duplicate sessions for the same checkout attempt. A second call with the same key returns the same session identifiers.

**Metadata:** Optional **metadata** (string key/value) is forwarded to the provider for reconciliation, analytics, and support lookups. No secrets in metadata.

**Money and tax (MVP scope):** The session is created in the **currency** we pass (ISO code). When **tax id** is present (e.g. EU VAT), the provider may validate or display it on hosted pages; we do not compute tax in-app for this MVP.

**Locale:** **Locale** controls hosted UI language where the provider supports it.

**Receipts:** **Customer email** is used for receipts and dunning; it may already exist on the customer object but we pass it explicitly for this flow when the product requires it on the session.

**Security and PCI:** Card collection happens only on the provider’s domain. Our API stores session ids and URLs, not PAN/CVC. Webhook signatures and secret rotation are handled outside this single file but the session must be created with enough context for downstream workers to verify events.

**Session lifetime:** The provider returns an **expires at** after which the URL must not be relied on; clients should refresh or create a new session.

**Fraud and velocity:** Callers are expected to have run rate limits upstream. This handler validates obvious bad input (empty ids, malformed URLs) before calling out.

## Inputs

- customer id
- price id
- success url
- cancel url
- trial days
- metadata
- idempotency key
- locale
- currency
- tax id
- customer email
- client reference id

## Output

- checkout session url
- session id
- expires at
- client reference id

## Notes for agent

The exported entry point is `createCheckoutSession` with parameters named `customerId`, `priceId`, `successUrl`, `cancelUrl`, `trialDays`, `metadata`, `idempotencyKey`, `currency`, `taxId`, `customerEmail`, and `clientReferenceId` (see `build.ts`). **Important:** `## Inputs` still lists **locale** as a product requirement — the current build is intentionally missing that parameter so you can run `intent-merge check` and practice the off-spec loop; add `locale` back to the function when you want the pair aligned again.