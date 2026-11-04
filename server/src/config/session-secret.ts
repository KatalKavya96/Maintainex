/** Fail closed: development and production must both supply a private signing key. */
export function sessionSecret(value: string | undefined): string {
  if (!value || Buffer.byteLength(value, "utf8") < 32 || value === "dev-only-maintainex-secret-change-me") {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes of private random material");
  }
  return value;
}
