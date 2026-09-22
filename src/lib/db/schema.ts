import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["booker", "artist"] })
    .notNull()
    .default("booker"),
  createdAt: createdAt(),
});

export const artists = sqliteTable(
  "artists",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    displayName: text("display_name").notNull(),
    category: text("category", {
      enum: ["dj", "band", "musician", "sound", "planner"],
    }).notNull(),
    tagline: text("tagline").notNull().default(""),
    bio: text("bio").notNull().default(""),
    city: text("city").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    travelRadiusKm: integer("travel_radius_km").notNull().default(50),
    hourlyRate: integer("hourly_rate").notNull(),
    minHours: integer("min_hours").notNull().default(2),
    genres: text("genres", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    eventTypes: text("event_types", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    equipment: text("equipment").notNull().default(""),
    imageKey: text("image_key"),
    avatarHue: integer("avatar_hue").notNull().default(280),
    published: integer("published", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: createdAt(),
  },
  (t) => [index("artists_category_idx").on(t.category)],
);

export const tracks = sqliteTable(
  "tracks",
  {
    id: id(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    source: text("source", {
      enum: ["upload", "soundcloud", "mixcloud", "youtube", "spotify"],
    }).notNull(),
    // Storage key for uploads, original link for embeds.
    url: text("url").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("tracks_artist_idx").on(t.artistId)],
);

export const addons = sqliteTable(
  "addons",
  {
    id: id(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    priceType: text("price_type", { enum: ["fixed", "per_hour"] })
      .notNull()
      .default("fixed"),
    createdAt: createdAt(),
  },
  (t) => [index("addons_artist_idx").on(t.artistId)],
);

export const blockedDates = sqliteTable(
  "blocked_dates",
  {
    id: id(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
  },
  (t) => [uniqueIndex("blocked_dates_artist_date_idx").on(t.artistId, t.date)],
);

export type BookingAddonLine = { id: string; name: string; amount: number };

export const bookings = sqliteTable(
  "bookings",
  {
    id: id(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    bookerId: text("booker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventDate: text("event_date").notNull(),
    startTime: text("start_time").notNull(),
    hours: integer("hours").notNull(),
    eventType: text("event_type").notNull(),
    guests: integer("guests").notNull(),
    location: text("location").notNull(),
    message: text("message").notNull().default(""),
    // Snapshot of the priced add-ons so later price edits don't rewrite history.
    addonLines: text("addon_lines", { mode: "json" })
      .$type<BookingAddonLine[]>()
      .notNull()
      .default(sql`'[]'`),
    performanceAmount: integer("performance_amount").notNull(),
    addonsAmount: integer("addons_amount").notNull(),
    serviceFee: integer("service_fee").notNull(),
    total: integer("total").notNull(),
    status: text("status", {
      enum: ["pending", "accepted", "declined", "cancelled"],
    })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
  },
  (t) => [
    index("bookings_artist_idx").on(t.artistId, t.eventDate),
    index("bookings_booker_idx").on(t.bookerId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_booking_idx").on(t.bookingId)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: id(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    // Reviews are tied to a completed booking so only real customers can post one.
    bookingId: text("booking_id")
      .unique()
      .references(() => bookings.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_artist_idx").on(t.artistId)],
);

export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Addon = typeof addons.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
