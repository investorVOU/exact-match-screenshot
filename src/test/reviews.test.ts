import { describe, it, expect } from "vitest";
import { reviewSchema } from "@/components/reviews";
const ok = { name: "Ada", location: "", car: "", rating: 5, comment: "Great car" };
describe("review rules", () => {
  it("accepts 1-5 stars", () => expect(reviewSchema.safeParse(ok).success).toBe(true));
  it("rejects missing rating", () => expect(reviewSchema.safeParse({ ...ok, rating: 0 }).success).toBe(false));
  it("rejects 6 stars", () => expect(reviewSchema.safeParse({ ...ok, rating: 6 }).success).toBe(false));
});
