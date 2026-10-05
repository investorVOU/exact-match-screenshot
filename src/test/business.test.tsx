import { describe, expect, it } from "vitest";
import { BUSINESS, formatNaira } from "@/config/business";
import { normalizeCarSearchTerms } from "@/lib/cars.functions";

describe("business rules", () => {
  it("formats prices as Naira like ₦9,500,000", () => {
    expect(formatNaira(9500000)).toBe("₦9,500,000");
  });
  it("shows 8 cars per page", () => {
    expect(BUSINESS.carsPerPage).toBe(8);
  });
  it("normalizes mixed-case full car searches into lowercase tokens", () => {
    expect(normalizeCarSearchTerms("2015 ToYoTa Camry")).toEqual(["2015", "toyota", "camry"]);
  });
});
