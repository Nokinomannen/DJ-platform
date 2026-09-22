import { describe, expect, it } from "vitest";
import { quote } from "./pricing";

const artist = { hourlyRate: 1500, minHours: 3 };

describe("quote", () => {
  it("bills at least the artist's minimum hours", () => {
    const q = quote(artist, 1, []);
    expect(q.billableHours).toBe(3);
    expect(q.performance).toBe(4500);
  });

  it("prices fixed and hourly add-ons", () => {
    const q = quote(artist, 4, [
      { id: "pa", name: "PA", price: 2000, priceType: "fixed" },
      { id: "light", name: "Ljus", price: 250, priceType: "per_hour" },
    ]);
    expect(q.addonLines).toEqual([
      { id: "pa", name: "PA", amount: 2000 },
      { id: "light", name: "Ljus", amount: 1000 },
    ]);
    expect(q.subtotal).toBe(6000 + 3000);
    expect(q.serviceFee).toBe(720);
    expect(q.total).toBe(9720);
  });

  it("rounds the service fee to whole kronor", () => {
    const q = quote({ hourlyRate: 1111, minHours: 1 }, 1, []);
    expect(q.serviceFee).toBe(89);
    expect(Number.isInteger(q.total)).toBe(true);
  });
});
