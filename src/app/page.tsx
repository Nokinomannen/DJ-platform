import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { SearchForm } from "@/components/search-form";
import { CATEGORIES } from "@/lib/constants";
import { getFeaturedArtists } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  dj: "🎧",
  band: "🥁",
  musician: "🎷",
  sound: "🔊",
  planner: "🎉",
};

export default async function Home() {
  const featured = await getFeaturedArtists(6);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 0%, rgba(212,255,63,0.18), transparent 70%), radial-gradient(50% 40% at 90% 10%, rgba(168,85,247,0.22), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24">
          <p className="chip mb-5 border-accent/40 text-accent">DJs · bands · sound · party planners</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Book the music for your party.
            <span className="block text-muted">No more digging through DMs.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Find artists near you, listen to real sets, see the price up front and add sound and lights to the same
            booking.
          </p>
          <div className="mt-10 max-w-4xl">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/search?category=${c.id}`}
              className="card group p-4 transition hover:border-accent/50 hover:bg-card-hover"
            >
              <span className="text-2xl" aria-hidden>
                {CATEGORY_ICONS[c.id]}
              </span>
              <p className="mt-3 font-semibold group-hover:text-accent">{c.plural}</p>
              <p className="mt-1 text-xs text-muted">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Popular right now</h2>
            <Link href="/search" className="text-sm text-muted hover:text-accent">
              See all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            ["1", "Find and listen", "Filter by city, date, genre and price, or browse the map. Listen to mixes right on the profile."],
            ["2", "Build your booking", "Pick the hours and add a PA, lights or a mic. You see the total price instantly."],
            ["3", "Send a request", "The artist confirms, you chat about the details, and after the party you leave a review."],
          ].map(([n, title, body]) => (
            <div key={n} className="card p-6">
              <span className="font-mono text-sm text-accent">0{n}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-accent/20 blur-3xl"
          />
          <p className="font-mono text-sm text-accent">For artists</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
            Your profile replaces the Instagram bio and the DM inbox.
          </h2>
          <ul className="mt-6 grid max-w-3xl gap-3 text-muted sm:grid-cols-2">
            <li>✓ Upload mixes or link SoundCloud and Mixcloud</li>
            <li>✓ Fixed prices and add-ons, no back-and-forth quotes</li>
            <li>✓ Block dates and only get requests you can take</li>
            <li>✓ Verified reviews from real bookings</li>
          </ul>
          <Link href="/signup?role=artist" className="btn-primary mt-8">
            Create a free artist profile
          </Link>
        </div>
      </section>
    </>
  );
}
