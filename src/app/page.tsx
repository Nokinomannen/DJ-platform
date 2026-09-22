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
          <p className="chip mb-5 border-accent/40 text-accent">DJs · band · ljud · festfixare</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Boka musiken till festen.
            <span className="block text-muted">Utan att leta i DM:s.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Hitta artister nära dig, lyssna på riktiga set, se priset direkt och lägg till ljud och ljus i samma
            bokning.
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
            <h2 className="text-2xl font-bold tracking-tight">Populära just nu</h2>
            <Link href="/search" className="text-sm text-muted hover:text-accent">
              Visa alla →
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
        <h2 className="text-2xl font-bold tracking-tight">Så funkar det</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            ["1", "Hitta och lyssna", "Filtrera på stad, datum, genre och pris. Lyssna på mixar direkt i profilen."],
            ["2", "Bygg din bokning", "Välj antal timmar och lägg till PA, ljus eller mikrofon. Du ser totalpriset direkt."],
            ["3", "Skicka förfrågan", "Artisten bekräftar, ni chattar om detaljerna och efter festen lämnar du omdöme."],
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
          <p className="font-mono text-sm text-accent">För artister</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
            Din profil ersätter Instagram-bion och DM-inkorgen.
          </h2>
          <ul className="mt-6 grid max-w-3xl gap-3 text-muted sm:grid-cols-2">
            <li>✓ Ladda upp mixar eller länka SoundCloud och Mixcloud</li>
            <li>✓ Fasta priser och tillägg, inga fram-och-tillbaka-offerter</li>
            <li>✓ Blockera datum och få bara förfrågningar du kan ta</li>
            <li>✓ Verifierade omdömen från riktiga bokningar</li>
          </ul>
          <Link href="/signup?role=artist" className="btn-primary mt-8">
            Skapa artistprofil gratis
          </Link>
        </div>
      </section>
    </>
  );
}
