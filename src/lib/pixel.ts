import { BUSINESS } from "@/config/business";

type Fbq = (...args: unknown[]) => void;

export const pixelEnabled = () => /^\d{6,}$/.test(BUSINESS.pixelId);

/** Fire a Meta Pixel standard event. Never throws, even if the pixel is blocked or missing. */
export function track(event: string, params?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined" || !pixelEnabled()) return;
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (typeof fbq === "function") fbq("track", event, params ?? {});
  } catch {
    /* ignore */
  }
}

export const trackContact = (method: "call" | "whatsapp", carName?: string) =>
  track("Contact", { method, ...(carName ? { content_name: carName } : {}) });

/** Inline base code injected in <head>. */
export const pixelScript = () =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');try{fbq('init','${BUSINESS.pixelId}');fbq('track','PageView');}catch(e){}`;
