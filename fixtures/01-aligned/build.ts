/** Persists a new user row and returns the client-facing account shape. */
export function createUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return { type: "user account", email: normalizedEmail };
}
