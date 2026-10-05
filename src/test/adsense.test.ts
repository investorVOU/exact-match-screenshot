import { describe, expect, it } from "vitest";
import { extractAdsensePublisherId } from "@/lib/adsense";

describe("AdSense publisher ID extraction", () => {
  it("accepts a publisher ID or extracts one from the standard code snippet", () => {
    const publisherId = "ca-pub-1234567890123456";

    expect(extractAdsensePublisherId(publisherId)).toBe(publisherId);
    expect(
      extractAdsensePublisherId(
        `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}"></script>`,
      ),
    ).toBe(publisherId);
  });

  it("returns an empty value when disabled and rejects invalid input", () => {
    expect(extractAdsensePublisherId("  ")).toBe("");
    expect(extractAdsensePublisherId("not an AdSense ID")).toBeNull();
    expect(extractAdsensePublisherId("ca-pub-1234")).toBeNull();
  });
});
