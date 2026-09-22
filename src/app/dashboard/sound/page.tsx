import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TrackItem } from "@/components/track-list";
import { addTrackLink, deleteTrack, uploadTrack } from "@/lib/actions/tracks";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getArtistForUser } from "@/lib/queries";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Ljud" };

export default async function SoundPage() {
  const user = await requireUser("/dashboard/sound");
  const artist = await getArtistForUser(user.id);
  if (!artist) redirect("/dashboard/profile");

  const tracks = await db
    .select()
    .from(schema.tracks)
    .where(eq(schema.tracks.artistId, artist.id))
    .orderBy(asc(schema.tracks.createdAt));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="text-lg font-semibold">Dina klipp</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Det här är det första bokare lyssnar på. Lägg ditt bästa set överst: 2–3 klipp som visar bredden räcker.
        </p>
        {tracks.length > 0 ? (
          <ul className="space-y-3">
            {tracks.map((track) => (
              <li key={track.id} className="relative">
                <TrackItem track={track} />
                <form action={deleteTrack.bind(null, track.id)} className="mt-1.5 text-right">
                  <button className="text-xs text-muted hover:text-danger">Ta bort</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-6 text-sm text-muted">Inga klipp än. Ladda upp en fil eller klistra in en länk.</p>
        )}
      </section>

      <aside className="space-y-6">
        <ActionForm action={uploadTrack} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">Ladda upp ljudfil</h3>
          <div>
            <label className="label" htmlFor="u-title">
              Titel
            </label>
            <input id="u-title" name="title" required placeholder="T.ex. Bröllopsmix 2026" className="input" />
          </div>
          <input
            type="file"
            name="file"
            required
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-card-hover file:px-4 file:py-2 file:text-foreground"
          />
          <p className="text-xs text-muted">MP3, M4A, WAV eller OGG, max 25 MB.</p>
          <SubmitButton className="btn-primary w-full" pendingText="Laddar upp…">
            Ladda upp
          </SubmitButton>
        </ActionForm>

        <ActionForm action={addTrackLink} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">Länka en mix</h3>
          <p className="text-xs text-muted">SoundCloud, Mixcloud, YouTube eller Spotify. Spelas direkt i din profil.</p>
          <div>
            <label className="label" htmlFor="l-title">
              Titel
            </label>
            <input id="l-title" name="title" required placeholder="T.ex. Live från Trädgården" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="l-url">
              Länk
            </label>
            <input id="l-url" name="url" type="url" required placeholder="https://soundcloud.com/…" className="input" />
          </div>
          <SubmitButton className="btn-secondary w-full">Lägg till länk</SubmitButton>
        </ActionForm>
      </aside>
    </div>
  );
}
