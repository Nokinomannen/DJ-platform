import { describe, expect, it } from "vitest";
import { distanceKm, findCity } from "./geo";

describe("findCity", () => {
  it("matches regardless of case and diacritics", () => {
    expect(findCity("goteborg")?.name).toBe("Göteborg");
    expect(findCity("  MALMÖ ")?.name).toBe("Malmö");
  });

  it("returns undefined for unknown or empty input", () => {
    expect(findCity("Atlantis")).toBeUndefined();
    expect(findCity("")).toBeUndefined();
  });
});

describe("distanceKm", () => {
  it("is roughly 400 km from Stockholm to Göteborg", () => {
    const d = distanceKm(findCity("Stockholm")!, findCity("Göteborg")!);
    expect(d).toBeGreaterThan(390);
    expect(d).toBeLessThan(405);
  });

  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 59, lng: 18 }, { lat: 59, lng: 18 })).toBe(0);
  });
});
