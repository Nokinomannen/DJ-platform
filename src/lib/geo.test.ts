import { describe, expect, it } from "vitest";
import { approximateLocation, distanceKm, findCity, inBounds, parseBounds } from "./geo";

describe("findCity", () => {
  it("matches regardless of case and diacritics", () => {
    expect(findCity("gothenburg")?.name).toBe("Gothenburg");
    expect(findCity("göteborg")?.name).toBe("Gothenburg");
    expect(findCity("  MALMÖ ")?.name).toBe("Malmö");
  });

  it("returns undefined for unknown or empty input", () => {
    expect(findCity("Atlantis")).toBeUndefined();
    expect(findCity("")).toBeUndefined();
  });
});

describe("distanceKm", () => {
  it("is roughly 400 km from Stockholm to Gothenburg", () => {
    const d = distanceKm(findCity("Stockholm")!, findCity("Gothenburg")!);
    expect(d).toBeGreaterThan(390);
    expect(d).toBeLessThan(405);
  });

  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 59, lng: 18 }, { lat: 59, lng: 18 })).toBe(0);
  });
});

describe("approximateLocation", () => {
  const stockholm = findCity("Stockholm")!;

  it("is stable for the same seed and differs between seeds", () => {
    expect(approximateLocation("a", stockholm)).toEqual(approximateLocation("a", stockholm));
    expect(approximateLocation("a", stockholm)).not.toEqual(approximateLocation("b", stockholm));
  });

  it("stays within a few kilometres of the real point", () => {
    for (const seed of ["dj-nova", "mira-b", "x", "another-seed"]) {
      const d = distanceKm(stockholm, approximateLocation(seed, stockholm));
      expect(d).toBeGreaterThanOrEqual(0.7);
      expect(d).toBeLessThanOrEqual(3.6);
    }
  });
});

describe("parseBounds", () => {
  it("parses south,west,north,east", () => {
    expect(parseBounds("59,17.5,59.5,18.5")).toEqual({ south: 59, west: 17.5, north: 59.5, east: 18.5 });
  });

  it("rejects malformed or inverted boxes", () => {
    expect(parseBounds("1,2,3")).toBeNull();
    expect(parseBounds("59.5,17,59,18")).toBeNull();
    expect(parseBounds("a,b,c,d")).toBeNull();
    expect(inBounds({ lat: 59.3, lng: 18 }, parseBounds("59,17.5,59.5,18.5")!)).toBe(true);
  });
});
