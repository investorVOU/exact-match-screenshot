import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "@/lib/pixel";

describe("Meta event tracking", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends matching event IDs to Pixel and the Conversions API", () => {
    const fbq = vi.fn();
    Object.defineProperty(window, "fbq", { configurable: true, value: fbq });
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: () => false });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    track("ViewContent", { content_name: "2015 Toyota Camry" });

    const browserOptions = fbq.mock.calls[0]?.[3] as { eventID?: string };
    const fetchOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const serverEvent = JSON.parse(fetchOptions.body as string) as {
      eventId: string;
      eventName: string;
    };

    expect(fbq).toHaveBeenCalledWith(
      "track",
      "ViewContent",
      { content_name: "2015 Toyota Camry" },
      { eventID: serverEvent.eventId },
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/meta-events");
    expect(serverEvent).toMatchObject({ eventId: expect.any(String), eventName: "ViewContent" });
  });
});