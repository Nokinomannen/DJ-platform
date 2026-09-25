"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArtistCard } from "@/components/artist-card";
import type { Bounds } from "@/lib/geo";
import type { ArtistCardData } from "@/lib/queries";

// Leaflet touches `window` on import, so the map only renders in the browser.
const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-card" />,
});

type Props = {
  artists: ArtistCardData[];
  heading: string;
  summary: string;
  searchedBounds: Bounds | null;
  emptyHint: string;
};

export function SearchResults({ artists, heading, summary, searchedBounds, emptyHint }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Re-fit the map only when the search itself changes, not on hover or popup state.
  const fitKey = searchParams.toString();

  const searchArea = (b: Bounds) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["city", "lat", "lng", "radius"]) params.delete(key);
    params.set("bounds", [b.south, b.west, b.north, b.east].map((n) => n.toFixed(4)).join(","));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <section className={`px-4 py-6 sm:px-6 ${showMap ? "hidden lg:block" : ""}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted">{summary}</p>
        </div>
        {artists.length > 0 ? (
          <div className="grid gap-5 pb-24 sm:grid-cols-2 lg:pb-6">
            {artists.map((a) => (
              <div
                key={a.id}
                onMouseEnter={() => setHoveredId(a.id)}
                onMouseLeave={() => setHoveredId((id) => (id === a.id ? null : id))}
                className={`rounded-2xl transition ${selectedId === a.id ? "ring-2 ring-accent" : ""}`}
              >
                <ArtistCard artist={a} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold">No results</p>
            <p className="mt-2 text-sm text-muted">{emptyHint}</p>
          </div>
        )}
      </section>

      <div
        className={`${
          showMap ? "fixed inset-x-0 top-16 bottom-0 z-10" : "hidden"
        } lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:border-l lg:border-border`}
      >
        <MapView
          artists={artists}
          activeId={hoveredId ?? selectedId}
          onSelect={setSelectedId}
          searchedBounds={searchedBounds}
          fitKey={fitKey}
          onSearchArea={searchArea}
          visible={showMap}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMap((v) => !v)}
        className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-2xl lg:hidden"
      >
        {showMap ? "Show list" : "Show map"}
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {showMap ? (
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          ) : (
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" strokeLinejoin="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
