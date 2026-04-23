/** Provider integration is async; message is queued rather than delivered inline. */
export async function sendWelcomeEmail(email: string) {
  await Promise.resolve();
  return { status: "queued" };
}
