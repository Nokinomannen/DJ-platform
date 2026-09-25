"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";

type Props = {
  defaults?: { city?: string; category?: string; date?: string };
};

export function SearchForm({ defaults = {} }: Props) {
  const router = useRouter();
  const [city, setCity] = useState(defaults.city ?? "");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location services.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCity("");
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location. Pick a city instead.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  };

  return (
    <form
      className="card grid gap-2 p-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:rounded-full"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const key of ["category", "date"]) {
          const value = String(data.get(key) ?? "");
          if (value) params.set(key, value);
        }
        if (coords && !city) {
          params.set("lat", coords.lat.toFixed(4));
          params.set("lng", coords.lng.toFixed(4));
        } else if (city) {
          params.set("city", city);
        }
        router.push(`/search?${params.toString()}`);
      }}
    >
      <div className="relative flex items-center rounded-full px-4 py-2 hover:bg-card-hover">
        <div className="flex-1">
          <label htmlFor="search-city" className="block text-[11px] font-semibold tracking-wide uppercase">
            Where
          </label>
          <input
            id="search-city"
            list="city-list"
            value={coords && !city ? "Near me" : city}
            onChange={(e) => {
              setCoords(null);
              setCity(e.target.value);
            }}
            placeholder="City, e.g. Stockholm"
            className="w-full bg-transparent text-sm placeholder:text-muted/70 focus:outline-none"
          />
          <datalist id="city-list">
            {CITIES.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="ml-2 shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent"
        >
          {locating ? "Locating…" : "Near me"}
        </button>
      </div>
      <div className="rounded-full px-4 py-2 hover:bg-card-hover">
        <label htmlFor="search-category" className="block text-[11px] font-semibold tracking-wide uppercase">
          What
        </label>
        <select
          id="search-category"
          name="category"
          defaultValue={defaults.category ?? ""}
          className="w-full bg-transparent text-sm focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-full px-4 py-2 hover:bg-card-hover">
        <label htmlFor="search-date" className="block text-[11px] font-semibold tracking-wide uppercase">
          When
        </label>
        <input
          id="search-date"
          type="date"
          name="date"
          defaultValue={defaults.date}
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>
      <button type="submit" className="btn-primary px-7 py-3.5">
        Search
      </button>
      {geoError && <p className="px-4 pb-2 text-xs text-danger sm:col-span-4">{geoError}</p>}
    </form>
  );
}
