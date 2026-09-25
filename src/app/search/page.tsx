import type { Metadata } from "next";
import Link from "next/link";
import { SearchResults } from "@/components/search/search-results";
import { CATEGORIES, categoryLabel, GENRES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";
import { searchArtists, type SearchFilters } from "@/lib/queries";

export const metadata: Metadata = { title: "Find artists" };

function pick(params: Record<string, string | string[] | undefined>): SearchFilters {
  const get = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) || undefined;
  };
  return {
    category: get("category"),
    city: get("city"),
    lat: get("lat"),
    lng: get("lng"),
    radius: get("radius"),
    genre: get("genre"),
    maxPrice: get("maxPrice"),
    date: get("date"),
    q: get("q"),
    bounds: get("bounds"),
  };
}

const selectClass =
  "rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:border-muted focus:border-accent focus:outline-none";

export default async function SearchPage(props: PageProps<"/search">) {
  const filters = pick(await props.searchParams);
  const { results, origin, bounds } = await searchArtists(filters);
  const usingLocation = Boolean(filters.lat && filters.lng);

  const plural = filters.category ? CATEGORIES.find((c) => c.id === filters.category)?.plural : "Artists";
  const heading = bounds
    ? `${plural} in this area`
    : origin
      ? `${plural} near ${origin.label}`
      : `${plural} across Sweden`;

  const summary = [
    `${results.length} ${results.length === 1 ? "result" : "results"}`,
    filters.date ? "available on that date" : null,
    filters.genre ?? null,
    origin ? "sorted by distance" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const emptyHint = bounds
    ? "Zoom out or move the map to find more artists."
    : `Try another date, a larger radius or ${
        filters.category ? `all categories instead of ${categoryLabel(filters.category)}` : "fewer filters"
      }.`;

  return (
    <>
      <form className="border-b border-border px-4 py-3 sm:px-6">
        {usingLocation && (
          <>
            <input type="hidden" name="lat" value={filters.lat} />
            <input type="hidden" name="lng" value={filters.lng} />
          </>
        )}
        {bounds && <input type="hidden" name="bounds" value={filters.bounds} />}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Name or style"
            aria-label="Search by name or style"
            className={`${selectClass} w-40 shrink-0 placeholder:text-muted/70`}
          />
          <select name="category" defaultValue={filters.category ?? ""} aria-label="Category" className={selectClass}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {!usingLocation && !bounds && (
            <select name="city" defaultValue={filters.city ?? ""} aria-label="City" className={selectClass}>
              <option value="">All of Sweden</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {!bounds && (
            <select name="radius" defaultValue={filters.radius ?? ""} aria-label="Max distance" className={selectClass}>
              <option value="">Any distance</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          )}
          <input
            type="date"
            name="date"
            defaultValue={filters.date}
            aria-label="Available on date"
            className={`${selectClass} shrink-0`}
          />
          <select name="genre" defaultValue={filters.genre ?? ""} aria-label="Genre" className={selectClass}>
            <option value="">All genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select name="maxPrice" defaultValue={filters.maxPrice ?? ""} aria-label="Max price per hour" className={selectClass}>
            <option value="">Any price</option>
            {[1000, 1500, 2000, 3000, 5000].map((p) => (
              <option key={p} value={p}>
                Up to SEK {p.toLocaleString("en-GB")}/hr
              </option>
            ))}
          </select>
          <button className="btn-primary shrink-0 px-5 py-2">Apply</button>
          {(bounds || usingLocation || Object.values(filters).some(Boolean)) && (
            <Link href="/search" className="btn-ghost shrink-0 px-3 py-2">
              Clear
            </Link>
          )}
        </div>
      </form>
      <SearchResults
        artists={results}
        heading={heading}
        summary={summary}
        searchedBounds={bounds}
        emptyHint={emptyHint}
      />
    </>
  );
}
