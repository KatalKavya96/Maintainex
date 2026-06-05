export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).toString();
}

export function getDomainFromUrl(url: string) {
  return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
}

export function generateFaviconUrl(url: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getDomainFromUrl(url))}&sz=128`;
}
