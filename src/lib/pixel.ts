import { BUSINESS } from "@/config/business";

type Fbq = (...args: unknown[]) => void;
export type MetaEventName = "PageView" | "ViewContent" | "Lead" | "Schedule" | "Contact";

export const pixelIdValid = (id: string) => /^\d{6,}$/.test(id);

/** True when the Meta Pixel base code has been installed on the page. */
export const pixelEnabled = () =>
  typeof window !== "undefined" && typeof (window as unknown as { fbq?: Fbq }).fbq === "function";

/** Fire a deduplicated browser Pixel + server Conversions API event. */
export function track(event: MetaEventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const eventId =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const fbq = pixelEnabled() ? (window as unknown as { fbq?: Fbq }).fbq : undefined;
    if (typeof fbq === "function") fbq("track", event, params, { eventID: eventId });
  } catch {
    /* ignore */
  }

  const body = JSON.stringify({
    eventName: event,
    eventId,
    eventSourceUrl: `${window.location.origin}${window.location.pathname}`,
    customData: params,
  });
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/meta-events", blob)) return;
    void fetch("/api/meta-events", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Ignore analytics failures. */
  }
}

/** Phone calls only. WhatsApp enquiries are Leads: use trackWhatsAppLead (never both). */
export const trackContact = (method: "call", carName?: string) =>
  track("Contact", { method, ...(carName ? { content_name: carName } : {}) });

/** A WhatsApp enquiry is a Lead. Pass the vehicle when the button belongs to one. */
export const trackWhatsAppLead = (car?: { name: string; id?: string }) =>
  track(
    "Lead",
    car
      ? {
          content_name: car.name,
          content_type: "vehicle",
          ...(car.id ? { content_ids: [car.id] } : {}),
          method: "whatsapp",
        }
      : { method: "whatsapp" },
  );

/** Inline base code injected in <head> for the given Pixel ID. */
export const pixelScript = (pixelId: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');try{fbq('init','${pixelId}');}catch(e){}`;

/** The effective Pixel ID: admin-set value first, config file as fallback. */
export const effectivePixelId = (adminId?: string) =>
  pixelIdValid(adminId ?? "") ? adminId! : BUSINESS.pixelId;
