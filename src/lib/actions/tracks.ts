"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { parseEmbed } from "@/lib/embeds";
import { firstIssue, type FormState } from "@/lib/form-state";
import { getArtistForUser } from "@/lib/queries";
import { AUDIO_TYPES, deleteUpload, saveUpload } from "@/lib/storage";

const { tracks } = schema;

const MAX_TRACKS = 12;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

async function requireOwnArtist() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/sound");
  const artist = await getArtistForUser(user.id);
  if (!artist) redirect("/dashboard/profile");
  return artist;
}

async function hasRoom(artistId: string) {
  const [row] = await db.select({ n: count() }).from(tracks).where(eq(tracks.artistId, artistId));
  return (row?.n ?? 0) < MAX_TRACKS;
}

function refresh(slug: string) {
  revalidatePath("/dashboard/sound");
  revalidatePath(`/artists/${slug}`);
}

const titleSchema = z.string().trim().min(1, "Give the clip a title.").max(80);

export async function uploadTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const artist = await requireOwnArtist();
  const title = titleSchema.safeParse(formData.get("title"));
  if (!title.success) return { error: firstIssue(title.error) };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an audio file." };
  if (!AUDIO_TYPES[file.type]) return { error: "The file must be MP3, M4A, AAC, WAV or OGG." };
  if (file.size > MAX_AUDIO_BYTES) return { error: "The file can be at most 25 MB. Link longer mixes from SoundCloud or Mixcloud." };
  if (!(await hasRoom(artist.id))) return { error: `You can have at most ${MAX_TRACKS} clips.` };

  const key = await saveUpload(file, AUDIO_TYPES);
  await db.insert(tracks).values({ artistId: artist.id, title: title.data, source: "upload", url: key });
  refresh(artist.slug);
  return { ok: "Clip uploaded." };
}

export async function addTrackLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const artist = await requireOwnArtist();
  const title = titleSchema.safeParse(formData.get("title"));
  if (!title.success) return { error: firstIssue(title.error) };

  const url = String(formData.get("url") ?? "").trim();
  const embed = parseEmbed(url);
  if (!embed) return { error: "The link must point to SoundCloud, Mixcloud, YouTube or Spotify." };
  if (!(await hasRoom(artist.id))) return { error: `You can have at most ${MAX_TRACKS} clips.` };

  await db.insert(tracks).values({ artistId: artist.id, title: title.data, source: embed.source, url });
  refresh(artist.slug);
  return { ok: "Link added." };
}

export async function deleteTrack(trackId: string) {
  const artist = await requireOwnArtist();
  const [track] = await db
    .delete(tracks)
    .where(and(eq(tracks.id, trackId), eq(tracks.artistId, artist.id)))
    .returning();
  if (track?.source === "upload") await deleteUpload(track.url);
  refresh(artist.slug);
}
