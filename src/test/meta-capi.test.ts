import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cars.server", () => ({
  publicDb: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { pixel_id: "123456789012345" } }) }),
      }),
    }),
  }),
}));

import {
  hashForMeta,
  normalizePhone,
  purchaseEventId,
  sendMetaEvent,
  sendPurchaseEvent,
} from "@/lib/meta-capi.server";

const sale = {
  carId: "11111111-2222-3333-4444-555555555555",
  carSlug: "2015-toyota-camry",
  vehicleName: "2015 Toyota Camry",
  salePrice: 9_500_000,
  buyerPhone: "0803 123 4567",
};

describe("Meta CAPI server sender", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env["META_CONVERSIONS_API_ACCESS_TOKEN"] = "token";
    fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    delete process.env["META_CONVERSIONS_API_ACCESS_TOKEN"];
    vi.unstubAllGlobals();
  });

  it("normalizes Nigerian numbers and hashes them", () => {
    expect(normalizePhone("0803 123 4567")).toBe("2348031234567");
    expect(normalizePhone("+234 803 123 4567")).toBe("2348031234567");
    expect(normalizePhone("123")).toBeNull();
    expect(hashForMeta("2348031234567")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("sends a Purchase with the required custom_data and a deterministic event_id", async () => {
    expect(await sendPurchaseEvent(sale)).toBe("sent");
    const payload = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    const event = payload.data[0];
    expect(event).toMatchObject({
      event_name: "Purchase",
      event_id: purchaseEventId(sale.carId),
      action_source: "physical_store",
      event_source_url: "https://rushautos.com.ng/cars/2015-toyota-camry",
      custom_data: {
        currency: "NGN",
        value: 9_500_000,
        content_name: "2015 Toyota Camry",
        content_type: "vehicle",
        content_ids: [sale.carId],
      },
    });
    expect(event.event_time).toEqual(expect.any(Number));
    expect(event.user_data).toEqual({ ph: [hashForMeta("2348031234567")] });
    expect(JSON.stringify(payload)).not.toContain("0803");
  });

  it("does not send a Purchase it cannot match to anyone", async () => {
    expect(await sendPurchaseEvent({ ...sale, buyerPhone: "" })).toBe("no_match_data");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the browser event payload shape (website, event_id, user_data)", async () => {
    await sendMetaEvent({
      eventName: "Lead",
      eventId: "abc-123",
      eventSourceUrl: "https://rushautos.com.ng/",
      userData: { client_user_agent: "UA" },
      customData: { method: "whatsapp" },
    });
    const event = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string).data[0];
    expect(event).toMatchObject({
      event_name: "Lead",
      event_id: "abc-123",
      action_source: "website",
      user_data: { client_user_agent: "UA" },
      custom_data: { method: "whatsapp" },
    });
  });

  it("is skipped when no access token is configured", async () => {
    delete process.env["META_CONVERSIONS_API_ACCESS_TOKEN"];
    expect(await sendPurchaseEvent(sale)).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
