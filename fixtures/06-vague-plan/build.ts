export function createUser(email: string, password: string, role?: string) {
  return { type: "user account", email, role };
}
