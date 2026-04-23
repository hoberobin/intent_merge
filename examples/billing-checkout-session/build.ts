export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialDays: number | undefined,
  metadata: Record<string, string> | undefined,
  idempotencyKey: string,
) {
  const checkoutSessionUrl = `https://pay.example.com/session/${idempotencyKey}`;
  const sessionId = `cs_${idempotencyKey.slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Here you would typically call the billing provider's API to create the checkout session
  // For example:
  // const response = await billingProvider.createSession({
  //   customerId,
  //   priceId,
  //   successUrl,
  //   cancelUrl,
  //   trialDays,
  //   metadata,
  //   idempotencyKey,
  // });

  return { checkoutSessionUrl, sessionId, expiresAt };
}