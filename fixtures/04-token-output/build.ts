/** Misaligned implementation: issues a token without returning account fields. */
export function createUser(email: string, password: string) {
  return { token: "abc123" };
}
