/** Public content never depends on an authenticated workspace session. */
export function isPublicRoute(pathname: string) {
  return ["/", "/login", "/signup", "/design-system"].includes(pathname);
}

/** Accept local, private destinations only; never forward OAuth tokens or external URLs. */
export function workspaceDestination(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\?#\s]/.test(value)) return "/dashboard";
  if (isPublicRoute(value) || value.startsWith("/api")) return "/dashboard";
  return value;
}
