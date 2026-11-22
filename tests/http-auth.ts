import assert from "node:assert/strict";

export function authCookie(headers: readonly string[] = []): string {
  const header = headers.find(value => value.startsWith("auth_token="));
  assert.ok(header && /;\s*HttpOnly\b/i.test(header), "Login must issue an HttpOnly cookie.");
  return header.split(";")[0];
}
