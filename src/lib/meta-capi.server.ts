import { createHash } from "node:crypto";
import { BUSINESS } from "@/config/business";
import { publicDb } from "@/lib/cars.server";

/**
 * Server-only Meta Conversions API sender. Shared by /api/meta-events (browser-originated
 * events, deduplicated against the Pixel via the same eventId) and by confirmed-sale
 * Purchase events (server-originated only).
 *
 * "Purchase" is deliberately NOT part of the browser-facing MetaEventName in pixel.ts and is
 * NOT accepted by /api/meta-events, so it can never be fired from a visitor's browser.
 */
export type ServerMetaEventName =
  "PageView" | "ViewContent" | "Lead" | "Schedule" | "Contact" | "Purchase";

export type CapiCustomData = Record<string, string | string[] | number>;
export type CapiUserData = Record<string, string | string[]>;
export type SendMetaEventResult = "sent" | "skipped" | "failed";

/** Whitelist + clamp the custom_data accepted from the browser. */
export function makeCustomData(input: Record<string, unknown> | undefined) {
  if (!input) return undefined;
  const result: CapiCustomData = {};
  for (const key of ["content_name", "content_type", "currency", "method"] as const) {
    const value = input[key];
    if (typeof value === "string") result[key] = value.slice(0, 200);
  }
  if (Array.isArray(input["content_ids"])) {
    result["content_ids"] = input["content_ids"]
      .filter((value): value is string => typeof value === "string")
      .slice(0, 10)
      .map((value) => value.slice(0, 200));
  }
  const value = input["value"];
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    result["value"] = value;
  }
  return Object.keys(result).length ? result : undefined;
}

export type SendMetaEventInput = {
  eventName: ServerMetaEventName;
  eventId: string;
  eventSourceUrl: string;
  userData: CapiUserData;
  customData?: CapiCustomData | undefined;
  actionSource?: "website" | "physical_store";
};

export async function sendMetaEvent(input: SendMetaEventInput): Promise<SendMetaEventResult> {
  const accessToken = process.env["META_CONVERSIONS_API_ACCESS_TOKEN"];
  if (!accessToken) return "skipped";

  let pixelId: string = BUSINESS.pixelId;
  try {
    const { data } = await publicDb()
      .from("site_settings")
      .select("pixel_id")
      .eq("id", 1)
      .maybeSingle();
    if (data?.pixel_id) pixelId = data.pixel_id;
  } catch {
    // Keep CAPI optional until its settings table is deployed.
  }
  if (!/^\d{6,}$/.test(pixelId)) return "skipped";

  const version = process.env["META_GRAPH_API_VERSION"] ?? "v23.0";
  const endpoint = new URL(`https://graph.facebook.com/${version}/${pixelId}/events`);
  endpoint.searchParams.set("access_token", accessToken);
  const testEventCode = process.env["META_TEST_EVENT_CODE"];
  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: input.actionSource ?? "website",
        event_source_url: input.eventSourceUrl,
        user_data: input.userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`[Meta CAPI] Event rejected with status ${response.status}`);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("[Meta CAPI] Event delivery failed");
    return "failed";
  }
}

/* ------------------------------ Purchase (confirmed sale) ------------------------------ */

/**
 * A confirmed sale is recorded by staff in the admin area, not in the customer's browser, so
 * there is no customer user-agent/IP/fbp to send. Meta requires client_user_agent for
 * action_source "website", so claiming "website" here would mean sending the admin's browser
 * data as if it were the buyer's. "physical_store" is the honest value for a sale closed
 * off-site (showroom / WhatsApp / phone). Change it only if you start storing the buyer's
 * original browser data with the lead.
 */
export const PURCHASE_ACTION_SOURCE = "physical_store" as const;

/** One car = one sale. Same ID on every retry/re-toggle lets Meta drop repeats. */
export const purchaseEventId = (carId: string) => `purchase_${carId}`;

/** Digits only, Nigerian local format (080…) -> international (23480…). Null if implausible. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export const hashForMeta = (value: string) =>
  createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export type PurchaseInput = {
  carId: string;
  carSlug: string;
  vehicleName: string;
  salePrice: number;
  buyerPhone?: string | undefined;
};

/**
 * Sends a Purchase to the Conversions API. Without a buyer identifier Meta cannot match the
 * sale to anyone, so nothing is sent and "no_match_data" is returned.
 */
export async function sendPurchaseEvent(
  input: PurchaseInput,
): Promise<SendMetaEventResult | "no_match_data"> {
  const phone = input.buyerPhone ? normalizePhone(input.buyerPhone) : null;
  if (!phone) return "no_match_data";

  return sendMetaEvent({
    eventName: "Purchase",
    eventId: purchaseEventId(input.carId),
    eventSourceUrl: `${BUSINESS.siteUrl}/cars/${encodeURIComponent(input.carSlug)}`,
    actionSource: PURCHASE_ACTION_SOURCE,
    userData: { ph: [hashForMeta(phone)] },
    customData: {
      currency: "NGN",
      value: input.salePrice,
      content_name: input.vehicleName,
      content_type: "vehicle",
      content_ids: [input.carId],
    },
  });
}
