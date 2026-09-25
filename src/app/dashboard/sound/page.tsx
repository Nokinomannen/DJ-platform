import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TrackItem } from "@/components/track-list";
import { addTrackLink, deleteTrack, uploadTrack } from "@/lib/actions/tracks";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getArtistForUser } from "@/lib/queries";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Sound" };

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
        <h2 className="text-lg font-semibold">Your clips</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          This is the first thing bookers listen to. Put your best set first: 2–3 clips that show your range are enough.
        </p>
        {tracks.length > 0 ? (
          <ul className="space-y-3">
            {tracks.map((track) => (
              <li key={track.id} className="relative">
                <TrackItem track={track} />
                <form action={deleteTrack.bind(null, track.id)} className="mt-1.5 text-right">
                  <button className="text-xs text-muted hover:text-danger">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-6 text-sm text-muted">No clips yet. Upload a file or paste a link.</p>
        )}
      </section>

      <aside className="space-y-6">
        <ActionForm action={uploadTrack} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">Upload an audio file</h3>
          <div>
            <label className="label" htmlFor="u-title">
              Title
            </label>
            <input id="u-title" name="title" required placeholder="E.g. Wedding mix 2026" className="input" />
          </div>
          <input
            type="file"
            name="file"
            required
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-card-hover file:px-4 file:py-2 file:text-foreground"
          />
          <p className="text-xs text-muted">MP3, M4A, WAV or OGG, max 25 MB.</p>
          <SubmitButton className="btn-primary w-full" pendingText="Uploading…">
            Upload
          </SubmitButton>
        </ActionForm>

        <ActionForm action={addTrackLink} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">Link a mix</h3>
          <p className="text-xs text-muted">SoundCloud, Mixcloud, YouTube or Spotify. Plays right on your profile.</p>
          <div>
            <label className="label" htmlFor="l-title">
              Title
            </label>
            <input id="l-title" name="title" required placeholder="E.g. Live at the club" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="l-url">
              Link
            </label>
            <input id="l-url" name="url" type="url" required placeholder="https://soundcloud.com/…" className="input" />
          </div>
          <SubmitButton className="btn-secondary w-full">Add link</SubmitButton>
        </ActionForm>
      </aside>
    </div>
  );
}
