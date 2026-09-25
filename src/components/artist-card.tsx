import Link from "next/link";
import { categoryLabel } from "@/lib/constants";
import { formatSek } from "@/lib/format";
import type { ArtistCardData } from "@/lib/queries";
import { Avatar } from "./avatar";
import { Rating } from "./stars";

export function ArtistCard({ artist }: { artist: ArtistCardData }) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:border-accent/50 hover:bg-card-hover"
    >
      <div className="relative">
        <Avatar
          name={artist.displayName}
          hue={artist.avatarHue}
          imageKey={artist.imageKey}
          className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.02]"
          textClassName="text-5xl"
        />
        <span className="absolute top-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {categoryLabel(artist.category)}
        </span>
        {artist.trackCount > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
            </svg>
            {artist.trackCount} {artist.trackCount === 1 ? "clip" : "clips"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{artist.displayName}</h3>
          <Rating value={artist.avgRating} count={artist.reviewCount} />
        </div>
        <p className="line-clamp-2 text-sm text-muted">{artist.tagline}</p>
        <div className="flex flex-wrap gap-1.5">
          {artist.genres.slice(0, 3).map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-2 text-sm">
          <span className="text-muted">
            {artist.city}
            {artist.distanceKm !== null && artist.distanceKm >= 1 && ` · ${artist.distanceKm} km away`}
          </span>
          <span>
            <span className="font-semibold">{formatSek(artist.hourlyRate)}</span>
            <span className="text-muted">/hr</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
