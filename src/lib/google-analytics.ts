/** Extract a Google Analytics 4 measurement ID from an ID or code snippet. */
export function extractGoogleAnalyticsId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/\bG-[A-Z0-9]{6,20}\b/i);
  return match?.[0].toUpperCase() ?? null;
}

/** Queue GA4 initialization before the external gtag script loads. */
export function googleAnalyticsScript(measurementId: string): string {
  return `window.dataLayer = window.dataLayer || [];function gtag(){window.dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${measurementId}', {send_page_view: false});`;
}
