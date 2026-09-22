import { and, asc, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { CATEGORY_IDS, type CategoryId } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { todayInSweden } from "@/lib/format";
import { distanceKm, findCity } from "@/lib/geo";

const { artists, reviews, tracks, blockedDates, bookings, users, addons } = schema;

const ratingStats = db
  .select({
    artistId: reviews.artistId,
    avgRating: sql<number>`avg(${reviews.rating})`.as("avg_rating"),
    reviewCount: sql<number>`count(*)`.as("review_count"),
  })
  .from(reviews)
  .groupBy(reviews.artistId)
  .as("rating_stats");

const trackStats = db
  .select({
    artistId: tracks.artistId,
    trackCount: sql<number>`count(*)`.as("track_count"),
  })
  .from(tracks)
  .groupBy(tracks.artistId)
  .as("track_stats");

const cardFields = {
  id: artists.id,
  slug: artists.slug,
  displayName: artists.displayName,
  category: artists.category,
  tagline: artists.tagline,
  city: artists.city,
  lat: artists.lat,
  lng: artists.lng,
  travelRadiusKm: artists.travelRadiusKm,
  hourlyRate: artists.hourlyRate,
  minHours: artists.minHours,
  genres: artists.genres,
  imageKey: artists.imageKey,
  avatarHue: artists.avatarHue,
  avgRating: ratingStats.avgRating,
  reviewCount: ratingStats.reviewCount,
  trackCount: trackStats.trackCount,
};

export type ArtistCardData = {
  id: string;
  slug: string;
  displayName: string;
  category: CategoryId;
  tagline: string;
  city: string;
  hourlyRate: number;
  minHours: number;
  genres: string[];
  imageKey: string | null;
  avatarHue: number;
  avgRating: number | null;
  reviewCount: number;
  trackCount: number;
  distanceKm: number | null;
};

export type SearchFilters = {
  category?: string;
  city?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  genre?: string;
  maxPrice?: string;
  date?: string;
  q?: string;
};

/** Artists that have neither blocked the date nor accepted another booking on it. */
function availableOn(date: string): SQL {
  return sql`not exists (select 1 from ${blockedDates} where ${blockedDates.artistId} = ${artists.id} and ${blockedDates.date} = ${date})
    and not exists (select 1 from ${bookings} where ${bookings.artistId} = ${artists.id} and ${bookings.eventDate} = ${date} and ${bookings.status} = 'accepted')`;
}

export function resolveOrigin(filters: Pick<SearchFilters, "city" | "lat" | "lng">) {
  const lat = Number(filters.lat);
  const lng = Number(filters.lng);
  if (filters.lat && filters.lng && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng, label: "din plats" };
  }
  const city = findCity(filters.city);
  return city ? { lat: city.lat, lng: city.lng, label: city.name } : null;
}

export async function searchArtists(filters: SearchFilters) {
  const conditions: SQL[] = [eq(artists.published, true)];

  if (filters.category && (CATEGORY_IDS as string[]).includes(filters.category)) {
    conditions.push(eq(artists.category, filters.category as CategoryId));
  }
  const maxPrice = Number(filters.maxPrice);
  if (filters.maxPrice && Number.isFinite(maxPrice) && maxPrice > 0) {
    conditions.push(lte(artists.hourlyRate, maxPrice));
  }
  if (filters.genre) {
    conditions.push(sql`exists (select 1 from json_each(${artists.genres}) where value = ${filters.genre})`);
  }
  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    conditions.push(availableOn(filters.date));
  }
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    conditions.push(or(like(artists.displayName, pattern), like(artists.tagline, pattern))!);
  }

  const rows = await db
    .select(cardFields)
    .from(artists)
    .leftJoin(ratingStats, eq(ratingStats.artistId, artists.id))
    .leftJoin(trackStats, eq(trackStats.artistId, artists.id))
    .where(and(...conditions));

  const origin = resolveOrigin(filters);
  const radius = Number(filters.radius);
  const hasRadius = Boolean(filters.radius) && Number.isFinite(radius) && radius > 0;

  const results: ArtistCardData[] = [];
  for (const row of rows) {
    const distance = origin ? distanceKm(origin, row) : null;
    if (distance !== null) {
      // The artist has to be willing to travel that far, and within the searcher's radius if set.
      if (distance > row.travelRadiusKm) continue;
      if (hasRadius && distance > radius) continue;
    }
    results.push(toCard(row, distance));
  }

  results.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null && Math.abs(a.distanceKm - b.distanceKm) > 1) {
      return a.distanceKm - b.distanceKm;
    }
    return (b.avgRating ?? 0) - (a.avgRating ?? 0) || b.reviewCount - a.reviewCount;
  });

  return { results, origin };
}

type CardRow = Omit<ArtistCardData, "distanceKm" | "reviewCount" | "trackCount"> & {
  reviewCount: number | null;
  trackCount: number | null;
};

function toCard(row: CardRow, distance: number | null): ArtistCardData {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    category: row.category,
    tagline: row.tagline,
    city: row.city,
    hourlyRate: row.hourlyRate,
    minHours: row.minHours,
    genres: row.genres,
    imageKey: row.imageKey,
    avatarHue: row.avatarHue,
    avgRating: row.avgRating === null ? null : Number(row.avgRating),
    reviewCount: Number(row.reviewCount ?? 0),
    trackCount: Number(row.trackCount ?? 0),
    distanceKm: distance === null ? null : Math.round(distance),
  };
}

export async function getFeaturedArtists(limit = 6) {
  const rows = await db
    .select(cardFields)
    .from(artists)
    .leftJoin(ratingStats, eq(ratingStats.artistId, artists.id))
    .leftJoin(trackStats, eq(trackStats.artistId, artists.id))
    .where(eq(artists.published, true))
    .orderBy(desc(sql`coalesce(${ratingStats.avgRating}, 0) * min(coalesce(${ratingStats.reviewCount}, 0), 5)`))
    .limit(limit);
  return rows.map((row) => toCard(row, null));
}

export async function getArtistProfile(slug: string) {
  const artist = await db.query.artists.findFirst({ where: eq(artists.slug, slug) });
  if (!artist) return null;

  const today = todayInSweden();
  const [artistTracks, artistAddons, artistReviews, blocked, taken] = await Promise.all([
    db.select().from(tracks).where(eq(tracks.artistId, artist.id)).orderBy(asc(tracks.createdAt)),
    db.select().from(addons).where(eq(addons.artistId, artist.id)).orderBy(asc(addons.price)),
    db.select().from(reviews).where(eq(reviews.artistId, artist.id)).orderBy(desc(reviews.createdAt)),
    db
      .select({ date: blockedDates.date })
      .from(blockedDates)
      .where(and(eq(blockedDates.artistId, artist.id), gte(blockedDates.date, today))),
    db
      .select({ date: bookings.eventDate })
      .from(bookings)
      .where(and(eq(bookings.artistId, artist.id), eq(bookings.status, "accepted"), gte(bookings.eventDate, today))),
  ]);

  const avgRating = artistReviews.length
    ? artistReviews.reduce((sum, r) => sum + r.rating, 0) / artistReviews.length
    : null;

  return {
    artist,
    tracks: artistTracks,
    addons: artistAddons,
    reviews: artistReviews,
    avgRating,
    unavailableDates: [...new Set([...blocked, ...taken].map((d) => d.date))].sort(),
  };
}

export async function isArtistAvailable(artistId: string, date: string) {
  const [blocked] = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(and(eq(blockedDates.artistId, artistId), eq(blockedDates.date, date)));
  if (blocked) return false;
  const [taken] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.artistId, artistId), eq(bookings.eventDate, date), eq(bookings.status, "accepted")));
  return !taken;
}

const bookerUsers = alias(users, "booker");

const bookingListFields = {
  id: bookings.id,
  eventDate: bookings.eventDate,
  startTime: bookings.startTime,
  hours: bookings.hours,
  eventType: bookings.eventType,
  location: bookings.location,
  total: bookings.total,
  status: bookings.status,
  createdAt: bookings.createdAt,
  artistName: artists.displayName,
  artistSlug: artists.slug,
  bookerName: bookerUsers.name,
};

export type BookingListItem = Awaited<ReturnType<typeof listBookingsForArtist>>[number];

export function listBookingsForArtist(artistId: string) {
  return db
    .select(bookingListFields)
    .from(bookings)
    .innerJoin(artists, eq(artists.id, bookings.artistId))
    .innerJoin(bookerUsers, eq(bookerUsers.id, bookings.bookerId))
    .where(eq(bookings.artistId, artistId))
    .orderBy(asc(bookings.eventDate));
}

export function listBookingsForBooker(userId: string) {
  return db
    .select(bookingListFields)
    .from(bookings)
    .innerJoin(artists, eq(artists.id, bookings.artistId))
    .innerJoin(bookerUsers, eq(bookerUsers.id, bookings.bookerId))
    .where(eq(bookings.bookerId, userId))
    .orderBy(desc(bookings.eventDate));
}

/** Loads a booking only if the user is its booker or the booked artist. */
export async function getBookingForUser(bookingId: string, userId: string) {
  const [row] = await db
    .select({
      booking: bookings,
      artist: {
        id: artists.id,
        userId: artists.userId,
        slug: artists.slug,
        displayName: artists.displayName,
        category: artists.category,
        imageKey: artists.imageKey,
        avatarHue: artists.avatarHue,
      },
      bookerName: bookerUsers.name,
    })
    .from(bookings)
    .innerJoin(artists, eq(artists.id, bookings.artistId))
    .innerJoin(bookerUsers, eq(bookerUsers.id, bookings.bookerId))
    .where(eq(bookings.id, bookingId));

  if (!row) return null;
  const isBooker = row.booking.bookerId === userId;
  const isArtist = row.artist.userId === userId;
  if (!isBooker && !isArtist) return null;

  const [thread, review] = await Promise.all([
    db
      .select({
        id: schema.messages.id,
        body: schema.messages.body,
        createdAt: schema.messages.createdAt,
        senderId: schema.messages.senderId,
        senderName: users.name,
      })
      .from(schema.messages)
      .innerJoin(users, eq(users.id, schema.messages.senderId))
      .where(eq(schema.messages.bookingId, bookingId))
      .orderBy(asc(schema.messages.createdAt)),
    db.query.reviews.findFirst({ where: eq(reviews.bookingId, bookingId) }),
  ]);

  return { ...row, isBooker, isArtist, thread, review: review ?? null };
}

export async function getArtistForUser(userId: string) {
  return (await db.query.artists.findFirst({ where: eq(artists.userId, userId) })) ?? null;
}

export async function getArtistAddons(artistId: string, ids?: string[]) {
  const conditions = [eq(addons.artistId, artistId)];
  if (ids) {
    if (ids.length === 0) return [];
    conditions.push(inArray(addons.id, ids));
  }
  return db.select().from(addons).where(and(...conditions)).orderBy(asc(addons.price));
}
