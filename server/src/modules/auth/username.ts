const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function uniqueUsername(seed: string, email: string, exists: (username: string) => Promise<unknown>) {
  const base = slug(seed) || slug(email.split("@")[0]) || "user";
  let username = base;
  let suffix = 1;
  while (await exists(username)) {
    suffix += 1;
    username = `${base}-${suffix}`;
  }
  return username;
}
