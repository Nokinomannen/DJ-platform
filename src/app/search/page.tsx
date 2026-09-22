import type { Metadata } from "next";
import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { CATEGORIES, categoryLabel, GENRES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";
import { searchArtists, type SearchFilters } from "@/lib/queries";

export const metadata: Metadata = { title: "Hitta artister" };

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
  };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const filters = pick(await props.searchParams);
  const { results, origin } = await searchArtists(filters);

  const heading = [
    filters.category ? CATEGORIES.find((c) => c.id === filters.category)?.plural : "Artister",
    origin ? `nära ${origin.label}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr]">
      <aside>
        <form className="card sticky top-24 space-y-4 p-5">
          {filters.lat && filters.lng && (
            <>
              <input type="hidden" name="lat" value={filters.lat} />
              <input type="hidden" name="lng" value={filters.lng} />
            </>
          )}
          <div>
            <label className="label" htmlFor="f-q">
              Sök
            </label>
            <input id="f-q" name="q" defaultValue={filters.q} placeholder="Namn eller stil" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="f-category">
              Kategori
            </label>
            <select id="f-category" name="category" defaultValue={filters.category ?? ""} className="input">
              <option value="">Alla</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {!(filters.lat && filters.lng) && (
            <div>
              <label className="label" htmlFor="f-city">
                Stad
              </label>
              <select id="f-city" name="city" defaultValue={filters.city ?? ""} className="input">
                <option value="">Hela Sverige</option>
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="f-radius">
              Max avstånd
            </label>
            <select id="f-radius" name="radius" defaultValue={filters.radius ?? ""} className="input">
              <option value="">Alla som reser hit</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-date">
              Ledig datum
            </label>
            <input id="f-date" type="date" name="date" defaultValue={filters.date} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="f-genre">
              Genre
            </label>
            <select id="f-genre" name="genre" defaultValue={filters.genre ?? ""} className="input">
              <option value="">Alla genrer</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-price">
              Max pris per timme
            </label>
            <select id="f-price" name="maxPrice" defaultValue={filters.maxPrice ?? ""} className="input">
              <option value="">Inget tak</option>
              {[1000, 1500, 2000, 3000, 5000].map((p) => (
                <option key={p} value={p}>
                  {p.toLocaleString("sv-SE")} kr
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full">Filtrera</button>
          <Link href="/search" className="block text-center text-xs text-muted hover:text-foreground">
            Rensa filter
          </Link>
        </form>
      </aside>

      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted">
            {results.length} {results.length === 1 ? "träff" : "träffar"}
            {filters.date && " som är lediga det datumet"}
            {filters.genre && ` · ${filters.genre}`}
            {origin && " · sorterat efter avstånd"}
          </p>
        </div>
        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold">Inga träffar</p>
            <p className="mt-2 text-sm text-muted">
              Prova ett annat datum, en större radie eller {filters.category ? `alla kategorier i stället för ${categoryLabel(filters.category)}` : "färre filter"}.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
