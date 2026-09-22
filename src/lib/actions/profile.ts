"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORY_IDS, EVENT_TYPES, GENRES } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { slugify } from "@/lib/format";
import { firstIssue, type FormState } from "@/lib/form-state";
import { findCity } from "@/lib/geo";
import { getArtistForUser } from "@/lib/queries";
import { deleteUpload, IMAGE_TYPES, saveUpload } from "@/lib/storage";

const { artists, addons, blockedDates, users } = schema;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Ange artistnamn.").max(60),
  category: z.enum(CATEGORY_IDS, "Välj kategori."),
  tagline: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(3000).default(""),
  city: z.string().refine((c) => Boolean(findCity(c)), "Välj en stad från listan."),
  travelRadiusKm: z.coerce.number().int().min(0).max(2000),
  hourlyRate: z.coerce.number("Ange timpris.").int().min(100, "Timpriset måste vara minst 100 kr.").max(100000),
  minHours: z.coerce.number().int().min(1).max(12),
  equipment: z.string().trim().max(1500).default(""),
});

async function uniqueSlug(base: string) {
  const root = slugify(base) || "artist";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const taken = await db.query.artists.findFirst({ where: eq(artists.slug, candidate) });
    if (!taken) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

async function requireArtistUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/profile");
  return user;
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArtistUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;
  const city = findCity(input.city)!;

  const genres = formData.getAll("genres").map(String).filter((g) => (GENRES as readonly string[]).includes(g));
  const eventTypeIds = EVENT_TYPES.map((e) => e.id as string);
  const eventTypes = formData.getAll("eventTypes").map(String).filter((e) => eventTypeIds.includes(e));
  const published = formData.get("published") === "on";

  const existing = await getArtistForUser(user.id);

  let imageKey = existing?.imageKey ?? null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (!IMAGE_TYPES[image.type]) return { error: "Bilden måste vara JPG, PNG eller WebP." };
    if (image.size > MAX_IMAGE_BYTES) return { error: "Bilden får vara max 5 MB." };
    imageKey = await saveUpload(image, IMAGE_TYPES);
    if (existing?.imageKey) await deleteUpload(existing.imageKey);
  }

  const values = {
    displayName: input.displayName,
    category: input.category,
    tagline: input.tagline,
    bio: input.bio,
    city: city.name,
    lat: city.lat,
    lng: city.lng,
    travelRadiusKm: input.travelRadiusKm,
    hourlyRate: input.hourlyRate,
    minHours: input.minHours,
    equipment: input.equipment,
    genres,
    eventTypes,
    published,
    imageKey,
  };

  let slug: string;
  if (existing) {
    await db.update(artists).set(values).where(eq(artists.id, existing.id));
    slug = existing.slug;
  } else {
    slug = await uniqueSlug(input.displayName);
    await db.insert(artists).values({
      ...values,
      userId: user.id,
      slug,
      avatarHue: Math.floor(Math.random() * 360),
    });
    // Anyone who creates a profile becomes an artist, even if they signed up to book.
    await db.update(users).set({ role: "artist" }).where(eq(users.id, user.id));
  }

  revalidatePath(`/artists/${slug}`);
  revalidatePath("/dashboard", "layout");
  return { ok: existing ? "Profilen är sparad." : "Profilen är skapad! Lägg till ljud så att bokare kan lyssna." };
}

const addonSchema = z.object({
  name: z.string().trim().min(2, "Ange namn på tillägget.").max(60),
  description: z.string().trim().max(200).default(""),
  price: z.coerce.number("Ange pris.").int().min(0).max(1000000),
  priceType: z.enum(["fixed", "per_hour"]),
});

async function requireOwnArtist() {
  const user = await requireArtistUser();
  const artist = await getArtistForUser(user.id);
  if (!artist) redirect("/dashboard/profile");
  return artist;
}

export async function addAddon(_prev: FormState, formData: FormData): Promise<FormState> {
  const artist = await requireOwnArtist();
  const parsed = addonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db.insert(addons).values({ ...parsed.data, artistId: artist.id });
  revalidatePath("/dashboard/extras");
  revalidatePath(`/artists/${artist.slug}`);
  return { ok: "Tillägget är sparat." };
}

export async function deleteAddon(addonId: string) {
  const artist = await requireOwnArtist();
  await db.delete(addons).where(and(eq(addons.id, addonId), eq(addons.artistId, artist.id)));
  revalidatePath("/dashboard/extras");
  revalidatePath(`/artists/${artist.slug}`);
}

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Välj ett datum."),
});

export async function addBlockedDate(_prev: FormState, formData: FormData): Promise<FormState> {
  const artist = await requireOwnArtist();
  const parsed = dateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db.insert(blockedDates).values({ artistId: artist.id, date: parsed.data.date }).onConflictDoNothing();
  revalidatePath("/dashboard/extras");
  revalidatePath(`/artists/${artist.slug}`);
  return { ok: "Datumet är blockerat." };
}

export async function removeBlockedDate(blockedId: string) {
  const artist = await requireOwnArtist();
  await db.delete(blockedDates).where(and(eq(blockedDates.id, blockedId), eq(blockedDates.artistId, artist.id)));
  revalidatePath("/dashboard/extras");
  revalidatePath(`/artists/${artist.slug}`);
}
