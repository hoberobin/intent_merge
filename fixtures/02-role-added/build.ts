/**
 * Signup handler — still exposes optional role while product plan forbids it for this release.
 */
export function createUser(email: string, password: string, role?: string) {
  return { type: "user account", email, role };
}
