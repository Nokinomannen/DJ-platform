import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Rating, Stars } from "@/components/stars";
import { TrackList } from "@/components/track-list";
import { getCurrentUser } from "@/lib/auth/session";
import { categoryLabel, eventTypeLabel } from "@/lib/constants";
import { formatDateTime, formatSek, todayInSweden } from "@/lib/format";
import { getArtistProfile } from "@/lib/queries";
import { BookingCard } from "./booking-card";

export async function generateMetadata(props: PageProps<"/artists/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const profile = await getArtistProfile(slug);
  if (!profile) return {};
  const { artist } = profile;
  return {
    title: `${artist.displayName} – ${categoryLabel(artist.category)} i ${artist.city}`,
    description: artist.tagline || artist.bio.slice(0, 160),
  };
}

export default async function ArtistPage(props: PageProps<"/artists/[slug]">) {
  const { slug } = await props.params;
  const [profile, user] = await Promise.all([getArtistProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const { artist, tracks, addons, reviews, avgRating, unavailableDates } = profile;
  const isOwner = user?.id === artist.userId;
  if (!artist.published && !isOwner) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-28 sm:px-6 lg:pb-10">
      {!artist.published && (
        <p className="card mb-6 border-accent/40 p-4 text-sm">
          Din profil är dold och syns inte i sökningar.{" "}
          <Link href="/dashboard/profile" className="text-accent underline">
            Publicera den
          </Link>
        </p>
      )}

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Avatar
          name={artist.displayName}
          hue={artist.avatarHue}
          imageKey={artist.imageKey}
          className="size-32 shrink-0 rounded-3xl sm:size-40"
          textClassName="text-5xl"
        />
        <div className="flex-1">
          <p className="text-sm text-muted">
            {categoryLabel(artist.category)} · {artist.city} · reser upp till {artist.travelRadiusKm} km
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{artist.displayName}</h1>
          {artist.tagline && <p className="mt-2 text-lg text-muted">{artist.tagline}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Rating value={avgRating} count={reviews.length} />
            {isOwner && (
              <Link href="/dashboard/profile" className="chip border-accent/40 text-accent">
                Redigera profil
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Lyssna</h2>
            {tracks.length > 0 ? (
              <TrackList tracks={tracks} />
            ) : (
              <p className="card p-6 text-sm text-muted">
                {isOwner ? (
                  <>
                    Du har inga ljudklipp än.{" "}
                    <Link href="/dashboard/sound" className="text-accent underline">
                      Lägg till ditt första
                    </Link>
                  </>
                ) : (
                  "Inga ljudklipp uppladdade än."
                )}
              </p>
            )}
          </section>

          {artist.bio && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Om {artist.displayName}</h2>
              <p className="whitespace-pre-line text-muted">{artist.bio}</p>
            </section>
          )}

          <section className="grid gap-6 sm:grid-cols-2">
            {artist.genres.length > 0 && (
              <div>
                <h3 className="label">Genrer</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((g) => (
                    <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className="chip hover:border-accent hover:text-accent">
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {artist.eventTypes.length > 0 && (
              <div>
                <h3 className="label">Spelar gärna på</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.eventTypes.map((e) => (
                    <span key={e} className="chip">
                      {eventTypeLabel(e)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {artist.equipment && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Ingår i priset</h2>
              <p className="card whitespace-pre-line p-5 text-sm text-muted">{artist.equipment}</p>
            </section>
          )}

          {addons.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Tillägg</h2>
              <ul className="card divide-y divide-border">
                {addons.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      {a.description && <p className="text-sm text-muted">{a.description}</p>}
                    </div>
                    <p className="shrink-0 text-sm">
                      {formatSek(a.price)}
                      {a.priceType === "per_hour" && <span className="text-muted">/tim</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Omdömen {reviews.length > 0 && <span className="text-muted">({reviews.length})</span>}
            </h2>
            {reviews.length > 0 ? (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{r.authorName}</p>
                      <Stars value={r.rating} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{r.body}</p>
                    <p className="mt-3 text-xs text-muted/70">
                      {formatDateTime(r.createdAt)}
                      {r.bookingId && " · Verifierad bokning"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Inga omdömen än. Omdömen kan bara lämnas efter en genomförd bokning.</p>
            )}
          </section>
        </div>

        <aside id="boka" className="scroll-mt-20">
          <div className="sticky top-24">
            <BookingCard
              artist={{ id: artist.id, hourlyRate: artist.hourlyRate, minHours: artist.minHours }}
              addons={addons.map((a) => ({ id: a.id, name: a.name, price: a.price, priceType: a.priceType }))}
              unavailableDates={unavailableDates}
              today={todayInSweden()}
              isLoggedIn={Boolean(user)}
              isOwner={isOwner}
              loginHref={`/login?next=${encodeURIComponent(`/artists/${artist.slug}`)}`}
            />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <p>
          <span className="font-bold">{formatSek(artist.hourlyRate)}</span>
          <span className="text-sm text-muted"> / timme</span>
        </p>
        {!isOwner && (
          <a href="#boka" className="btn-primary">
            Boka
          </a>
        )}
      </div>
    </div>
  );
}
