import { describe, expect, it } from "vitest";
import { BUSINESS, formatNaira } from "@/config/business";

describe("business rules", () => {
  it("formats prices as Naira like ₦9,500,000", () => {
    expect(formatNaira(9500000)).toBe("₦9,500,000");
  });
  it("shows 8 cars per page", () => {
    expect(BUSINESS.carsPerPage).toBe(8);
  });
});
