const schemaPattern = /^cgp_test_[a-f0-9]{24}$/;

export function assertIsolatedDatabase(value = process.env.DATABASE_URL): URL {
  const url = new URL(value ?? "");
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      !schemaPattern.test(url.searchParams.get("schema") ?? "")) {
    throw new Error("Integration tests require an isolated local PostgreSQL schema. Run npm test.");
  }
  return url;
}
