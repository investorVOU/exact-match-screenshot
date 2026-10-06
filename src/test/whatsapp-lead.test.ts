import { afterEach, describe, expect, it, vi } from "vitest";
import { trackContact, trackWhatsAppLead } from "@/lib/pixel";

function setup() {
  const fbq = vi.fn();
  Object.defineProperty(window, "fbq", { configurable: true, value: fbq });
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: () => false });
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  return { fbq, fetchMock };
}

describe("WhatsApp enquiries are Leads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fires exactly one Lead (no Contact) for a vehicle WhatsApp click, with matching IDs", () => {
    const { fbq, fetchMock } = setup();
    trackWhatsAppLead({ name: "2015 Toyota Camry", id: "car-1" });

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const params = {
      content_name: "2015 Toyota Camry",
      content_type: "vehicle",
      content_ids: ["car-1"],
      method: "whatsapp",
    };
    expect(fbq).toHaveBeenCalledWith("track", "Lead", params, { eventID: expect.any(String) });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body).toMatchObject({ eventName: "Lead", customData: params });
    expect(body.eventId).toBe((fbq.mock.calls[0]?.[3] as { eventID: string }).eventID);
  });

  it("tracks a general WhatsApp enquiry as Lead with only the method", () => {
    const { fbq } = setup();
    trackWhatsAppLead();
    expect(fbq).toHaveBeenCalledWith("track", "Lead", { method: "whatsapp" }, expect.anything());
  });

  it("keeps phone calls as Contact", () => {
    const { fbq } = setup();
    trackContact("call", "2015 Toyota Camry");
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Contact",
      { method: "call", content_name: "2015 Toyota Camry" },
      expect.anything(),
    );
  });
});
