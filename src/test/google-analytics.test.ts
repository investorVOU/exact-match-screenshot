import { describe, expect, it } from "vitest";
import { extractGoogleAnalyticsId, googleAnalyticsScript } from "@/lib/google-analytics";

describe("Google Analytics measurement ID", () => {
  it("accepts an ID or extracts one from the Google tag snippet", () => {
    const measurementId = "G-ABC123XYZ9";

    expect(extractGoogleAnalyticsId(measurementId)).toBe(measurementId);
    expect(
      extractGoogleAnalyticsId(
        `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>`,
      ),
    ).toBe(measurementId);
  });

  it("normalizes the ID and rejects invalid input", () => {
    expect(extractGoogleAnalyticsId("g-abc123xyz9")).toBe("G-ABC123XYZ9");
    expect(extractGoogleAnalyticsId(" ")).toBe("");
    expect(extractGoogleAnalyticsId("not a measurement ID")).toBeNull();
    expect(extractGoogleAnalyticsId("G-123")).toBeNull();
  });

  it("disables automatic page views for SPA route tracking", () => {
    expect(googleAnalyticsScript("G-ABC123XYZ9")).toContain("send_page_view: false");
  });
});
