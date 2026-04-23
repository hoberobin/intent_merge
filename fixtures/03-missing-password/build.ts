export function createUser(email: string, password: string) {
  return { type: "user account", email, password };
}