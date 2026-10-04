/**
 * RUSH AUTOS — BUSINESS SETTINGS
 * Change these values and the whole site updates.
 */
export const BUSINESS = {
  /** Shop name shown in titles and messages */
  name: "Rush Autos",

  /** WhatsApp + phone number, international format WITHOUT "+" (e.g. 2348012345678) */
  phone: "2348XXXXXXXXX",

  /** Meta (Facebook/Instagram) Pixel ID. Leave as-is to disable tracking. */
  pixelId: "YOUR_PIXEL_ID",

  /** Showroom address shown in the footer */
  address: "YOUR ADDRESS, LAGOS",

  /** Your live website address (no trailing slash). Used for share previews and the sitemap. */
  siteUrl: "https://rushautos.com.ng",

  /** Default WhatsApp message from the bottom nav "Chat" button */
  defaultWhatsAppMessage: "Hello Rush Autos, I'm interested in a car.",

  /** How many cars per page on the listings */
  carsPerPage: 8,
} as const;

/** Currency: Nigerian Naira, e.g. ₦9,500,000 */
export const formatNaira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

export const telLink = () => `tel:+${BUSINESS.phone}`;
export const waLink = (message: string = BUSINESS.defaultWhatsAppMessage) =>
  `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(message)}`;
export const displayPhone = () => `+${BUSINESS.phone}`;
