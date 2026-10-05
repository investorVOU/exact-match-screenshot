/** Extract a Google AdSense publisher ID from an ID or the provided code snippet. */
export function extractAdsensePublisherId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.match(/\bca-pub-\d{16}\b/)?.[0] ?? null;
}
