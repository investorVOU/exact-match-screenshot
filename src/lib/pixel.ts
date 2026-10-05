import { BUSINESS } from "@/config/business";

type Fbq = (...args: unknown[]) => void;

export const pixelIdValid = (id: string) => /^\d{6,}$/.test(id);

/** True when the Meta Pixel base code has been installed on the page. */
export const pixelEnabled = () =>
  typeof window !== "undefined" && typeof (window as unknown as { fbq?: Fbq }).fbq === "function";

/** Fire a Meta Pixel standard event. Never throws, even if the pixel is blocked or missing. */
export function track(event: string, params?: Record<string, unknown>) {
  try {
    if (!pixelEnabled()) return;
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (typeof fbq === "function") fbq("track", event, params ?? {});
  } catch {
    /* ignore */
  }
}

export const trackContact = (method: "call" | "whatsapp", carName?: string) =>
  track("Contact", { method, ...(carName ? { content_name: carName } : {}) });

/** Inline base code injected in <head> for the given Pixel ID. */
export const pixelScript = (pixelId: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');try{fbq('init','${pixelId}');fbq('track','PageView');}catch(e){}`;

/** The effective Pixel ID: admin-set value first, config file as fallback. */
export const effectivePixelId = (adminId?: string) =>
  pixelIdValid(adminId ?? "") ? adminId! : BUSINESS.pixelId;
