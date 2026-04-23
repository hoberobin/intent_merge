/** Intentionally out of spec: `plan.md` lists `locale` under Inputs, but this export omits `locale` for mismatch-loop testing. */
const SESSION_TTL_MS = 30 * 60 * 1000;
const CHECKOUT_BASE = "https://pay.example.com/session";

function isNonEmpty(s: string): boolean {
  return s.trim().length > 0;
}

function assertHttpUrl(label: string, value: string): void {
  const t = value.trim();
  if (!t.startsWith("https://")) {
    throw new Error(`${label} must be an https URL`);
  }
}

function normalizeMetadata(meta: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    const key = k.trim();
    if (!key) continue;
    out[key] = String(v).trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Creates a hosted checkout session for subscriptions or one-time prices.
 * Integrates with a billing provider; this module holds the server-side entry point only.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialDays: number | undefined,
  metadata: Record<string, string> | undefined,
  idempotencyKey: string,
  currency: string,
  taxId: string | undefined,
  customerEmail: string,
  clientReferenceId: string | undefined,
) {
  if (!isNonEmpty(customerId)) throw new Error("customerId is required");
  if (!isNonEmpty(priceId)) throw new Error("priceId is required");
  if (!isNonEmpty(idempotencyKey)) throw new Error("idempotencyKey is required");
  if (!isNonEmpty(currency)) throw new Error("currency is required");
  if (!isNonEmpty(customerEmail)) throw new Error("customerEmail is required");

  assertHttpUrl("successUrl", successUrl);
  assertHttpUrl("cancelUrl", cancelUrl);

  if (trialDays !== undefined && (!Number.isFinite(trialDays) || trialDays < 0)) {
    throw new Error("trialDays must be a non-negative number when provided");
  }

  const meta = normalizeMetadata(metadata);
  const tax = taxId?.trim() || undefined;
  const clientRef = clientReferenceId?.trim() || undefined;

  const sessionId = `cs_${idempotencyKey.slice(0, 12)}`;
  const checkoutSessionUrl = `${CHECKOUT_BASE}/${encodeURIComponent(sessionId)}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  void successUrl;
  void cancelUrl;
  void meta;
  void tax;
  void clientRef;
  void trialDays;

  return { checkoutSessionUrl, sessionId, expiresAt, clientReferenceId: clientRef ?? null };
}
