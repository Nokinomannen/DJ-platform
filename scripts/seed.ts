/**
 * Resets the database to a demo state: fictional artists across Sweden, add-ons,
 * reviews tied to past bookings, pending requests and synthesised demo audio.
 * Every demo account uses the password "gigga1234".
 */
import { rm } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { renderDemoLoop } from "./demo-audio";
import { saveBuffer } from "../src/lib/storage";
import { findCity } from "../src/lib/geo";
import { quote } from "../src/lib/pricing";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:data/gigga.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

const PASSWORD = "gigga1234";

type SeedArtist = {
  slug: string;
  displayName: string;
  category: schema.Artist["category"];
  city: string;
  tagline: string;
  bio: string;
  hourlyRate: number;
  minHours: number;
  travelRadiusKm: number;
  genres: string[];
  eventTypes: string[];
  equipment: string;
  hue: number;
  addons: { name: string; description?: string; price: number; priceType: "fixed" | "per_hour" }[];
  demo?: { title: string; bpm: number; rootHz: number; swing?: number; minor?: boolean }[];
};

const ARTISTS: SeedArtist[] = [
  {
    slug: "dj-nova",
    displayName: "DJ Nova",
    category: "dj",
    city: "Stockholm",
    tagline: "Wedding and corporate DJ who reads the dance floor from the first track",
    bio: "I've played more than 300 weddings, Christmas parties and launch events since 2014. My focus is getting the whole crowd dancing, from the cousins to grandma.\n\nWe go through request lists and no-go songs before the party, and I always bring a mic for speeches.",
    hourlyRate: 1800,
    minHours: 3,
    travelRadiusKm: 120,
    genres: ["House", "Disco", "Pop", "80s", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "birthday", "private"],
    equipment: "Pioneer CDJ-3000 × 2 and DJM-900NXS2\nTwo RCF speakers, enough for about 120 guests\nWireless mic for speeches",
    hue: 285,
    addons: [
      { name: "Extra PA for 120–300 guests", description: "Two tops + subwoofer", price: 2500, priceType: "fixed" },
      { name: "Light package", description: "4 moving heads, smoke machine and uplights", price: 1800, priceType: "fixed" },
      { name: "Ceremony music", description: "Separate sound for the ceremony", price: 1500, priceType: "fixed" },
    ],
    demo: [
      { title: "Wedding mix – disco & house", bpm: 122, rootHz: 220, swing: 0.08, minor: false },
      { title: "Late night – deep house", bpm: 118, rootHz: 196 },
    ],
  },
  {
    slug: "mira-b",
    displayName: "Mira B",
    category: "dj",
    city: "Stockholm",
    tagline: "Hip hop, R&B and afrobeats for clubs and birthdays",
    bio: "Resident at two clubs on Södermalm. I play everything from 2000s R&B to new afrobeats and amapiano. Perfect when you want your party to feel like a club night.",
    hourlyRate: 1400,
    minHours: 3,
    travelRadiusKm: 60,
    genres: ["Hip hop", "R&B", "Afrobeats", "Dancehall"],
    eventTypes: ["club", "birthday", "student", "private"],
    equipment: "Own DJ setup (Rane Seventy + Technics). Sound system available as an add-on.",
    hue: 330,
    addons: [
      { name: "PA system for up to 150 guests", price: 2200, priceType: "fixed" },
      { name: "MC/hype man", description: "A hype man from my crew", price: 600, priceType: "per_hour" },
    ],
    demo: [{ title: "R&B favourites – 95 bpm", bpm: 95, rootHz: 174.6, swing: 0.2 }],
  },
  {
    slug: "soulsystem",
    displayName: "Soulsystem",
    category: "band",
    city: "Stockholm",
    tagline: "Five-piece band playing funk, soul and sing-along pop",
    bio: "Vocals, guitar, bass, drums and keys. We play two 45-minute sets with a DJ playlist in between. Over 150 weddings and corporate parties.",
    hourlyRate: 4800,
    minHours: 2,
    travelRadiusKm: 200,
    genres: ["Funk & soul", "Pop", "80s", "Disco"],
    eventTypes: ["wedding", "corporate"],
    equipment: "Full sound system and sound engineer for up to 250 guests.",
    hue: 25,
    addons: [
      { name: "Horn section", description: "Trumpet + sax", price: 6000, priceType: "fixed" },
      { name: "Acoustic mingle set", description: "Duo during dinner", price: 3500, priceType: "fixed" },
    ],
    demo: [{ title: "Live medley (demo)", bpm: 108, rootHz: 146.8, swing: 0.15, minor: false }],
  },
  {
    slug: "kasper-lind",
    displayName: "Kasper Lind",
    category: "musician",
    city: "Stockholm",
    tagline: "Live sax over DJ sets, or jazz for the mingle",
    bio: "Saxophonist who plays live alongside the DJ. Works just as well for a mellow jazz mingle as for a packed dance floor peak.",
    hourlyRate: 1200,
    minHours: 1,
    travelRadiusKm: 80,
    genres: ["House", "Jazz", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "club"],
    equipment: "Wireless sax mic and in-ears. Plugs into the DJ's mixer.",
    hue: 45,
    addons: [{ name: "Own PA for the mingle", price: 900, priceType: "fixed" }],
    demo: [{ title: "Sax x house", bpm: 120, rootHz: 233.1, swing: 0.1 }],
  },
  {
    slug: "nordljud",
    displayName: "Nordljud",
    category: "sound",
    city: "Stockholm",
    tagline: "Sound, lights and techs for 20 to 800 guests",
    bio: "We deliver, rig and strike. Book by the hour and add a technician or a stage as needed.",
    hourlyRate: 900,
    minHours: 4,
    travelRadiusKm: 150,
    genres: [],
    eventTypes: ["wedding", "corporate", "private", "student"],
    equipment: "PA for up to 200 guests, mixing desk, two wireless mics, delivery and rigging.",
    hue: 200,
    addons: [
      { name: "Sound technician on site", price: 450, priceType: "per_hour" },
      { name: "Stage 4 × 3 m", price: 3500, priceType: "fixed" },
      { name: "Large light package", description: "8 moving heads + hazer", price: 4000, priceType: "fixed" },
    ],
  },
  {
    slug: "festfabriken",
    displayName: "Festfabriken",
    category: "planner",
    city: "Stockholm",
    tagline: "We handle it all: venue, music, food and schedule",
    bio: "Party planners for weddings, anniversaries and corporate parties. We find the venue, book the artists and run the schedule on the night, so you get to be a guest at your own party.",
    hourlyRate: 1100,
    minHours: 5,
    travelRadiusKm: 100,
    genres: [],
    eventTypes: ["wedding", "corporate", "birthday"],
    equipment: "Project management before and during the event.",
    hue: 160,
    addons: [
      { name: "Toastmaster", price: 3000, priceType: "fixed" },
      { name: "Decor & flowers", price: 5000, priceType: "fixed" },
    ],
  },
  {
    slug: "dj-kustbris",
    displayName: "DJ Kustbris",
    category: "dj",
    city: "Gothenburg",
    tagline: "Schlager, 80s and sing-alongs, the west coast party guarantee",
    bio: "For parties where everyone sings along. I specialise in 40th, 50th and 60th birthdays and bring the right songs for every generation.",
    hourlyRate: 1100,
    minHours: 4,
    travelRadiusKm: 100,
    genres: ["Schlager", "Pop", "80s"],
    eventTypes: ["birthday", "wedding", "private"],
    equipment: "Full DJ rig and sound for up to 100 guests. Mic included.",
    hue: 190,
    addons: [
      { name: "Disco lights", price: 800, priceType: "fixed" },
      { name: "Karaoke package", description: "Screen + two mics", price: 1200, priceType: "fixed" },
    ],
    demo: [{ title: "Sing-along mix", bpm: 128, rootHz: 261.6, minor: false }],
  },
  {
    slug: "techno-tove",
    displayName: "Techno Tove",
    category: "dj",
    city: "Gothenburg",
    tagline: "Techno and house for club nights and afterparties",
    bio: "Has played festivals and clubs across the Nordics. Booked for clubs, launch parties and private afterparties that should feel like Berlin.",
    hourlyRate: 1600,
    minHours: 2,
    travelRadiusKm: 500,
    genres: ["Techno", "House", "Drum & bass"],
    eventTypes: ["club", "private"],
    equipment: "USB/CDJ set, needs a DJ booth on site or the add-on.",
    hue: 260,
    addons: [{ name: "DJ booth + monitor", price: 1500, priceType: "fixed" }],
    demo: [
      { title: "Peak time techno", bpm: 132, rootHz: 110 },
      { title: "Warm-up house", bpm: 124, rootHz: 130.8 },
    ],
  },
  {
    slug: "vastkust-live",
    displayName: "Västkust Live",
    category: "band",
    city: "Gothenburg",
    tagline: "Acoustic trio for ceremony, dinner and dancing",
    bio: "Vocals, guitar and cajón. We adapt to the evening, from ceremony music to danceable covers.",
    hourlyRate: 3200,
    minHours: 2,
    travelRadiusKm: 150,
    genres: ["Pop", "Acoustic", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "private"],
    equipment: "Own sound for up to 120 guests.",
    hue: 15,
    addons: [{ name: "Ceremony music", description: "3 songs during the ceremony", price: 2500, priceType: "fixed" }],
    demo: [{ title: "Acoustic demo", bpm: 96, rootHz: 196, swing: 0.25, minor: false }],
  },
  {
    slug: "salsa-samuel",
    displayName: "Salsa Samuel",
    category: "dj",
    city: "Malmö",
    tagline: "Latin, reggaeton and afrobeats that get everyone moving",
    bio: "Born in Bogotá, raised in Malmö. Specialist in Latin parties, weddings with international guests and summer parties.",
    hourlyRate: 1300,
    minHours: 3,
    travelRadiusKm: 90,
    genres: ["Latin", "Reggaeton", "Afrobeats", "Pop"],
    eventTypes: ["wedding", "birthday", "club", "private"],
    equipment: "DJ rig and speakers for up to 80 guests.",
    hue: 5,
    addons: [
      { name: "Salsa lesson for guests", description: "30 min with a dance instructor", price: 1500, priceType: "fixed" },
      { name: "Bigger PA", price: 1800, priceType: "fixed" },
    ],
    demo: [{ title: "Reggaeton set", bpm: 98, rootHz: 164.8, swing: 0.12 }],
  },
  {
    slug: "oresund-sound",
    displayName: "Öresund Sound",
    category: "sound",
    city: "Malmö",
    tagline: "Sound and light rental in Skåne, with delivery",
    bio: "We rent out everything from a simple mingle setup to full festival rigs across Skåne.",
    hourlyRate: 800,
    minHours: 3,
    travelRadiusKm: 120,
    genres: [],
    eventTypes: ["wedding", "corporate", "student", "private"],
    equipment: "PA for 100 guests, mixer, two mics. Delivery in Malmö/Lund included.",
    hue: 210,
    addons: [
      { name: "Technician", price: 400, priceType: "per_hour" },
      { name: "Uplights × 8", price: 900, priceType: "fixed" },
    ],
  },
  {
    slug: "linnea-sjoberg",
    displayName: "Linnea Sjöberg",
    category: "musician",
    city: "Malmö",
    tagline: "Vocals and piano for ceremony, dinner and mingle",
    bio: "Trained at the Malmö Academy of Music. I sing everything from Laleh and Adele to jazz standards and tailor the set list to you.",
    hourlyRate: 1500,
    minHours: 1,
    travelRadiusKm: 150,
    genres: ["Acoustic", "Jazz", "Pop"],
    eventTypes: ["wedding", "corporate"],
    equipment: "Stage piano and sound for up to 80 guests.",
    hue: 340,
    addons: [{ name: "Learn a requested song", price: 800, priceType: "fixed" }],
    demo: [{ title: "Piano ballad (demo)", bpm: 76, rootHz: 261.6, minor: false }],
  },
  {
    slug: "dj-fyris",
    displayName: "DJ Fyris",
    category: "dj",
    city: "Uppsala",
    tagline: "Student nations, parties and birthdays at student prices",
    bio: "Plays the student nations every weekend. The cheapest in town for dinners and student parties, but just as happy at your 30th.",
    hourlyRate: 950,
    minHours: 3,
    travelRadiusKm: 80,
    genres: ["Pop", "Hip hop", "80s", "Schlager"],
    eventTypes: ["student", "birthday", "private"],
    equipment: "Controller and speakers for up to 70 guests.",
    hue: 100,
    addons: [{ name: "Light string + strobe", price: 500, priceType: "fixed" }],
    demo: [{ title: "Nation mix", bpm: 126, rootHz: 185, minor: false }],
  },
  {
    slug: "norrsken-djs",
    displayName: "Norrsken DJs",
    category: "dj",
    city: "Umeå",
    tagline: "DJ duo travelling all over northern Sweden",
    bio: "Two DJs taking turns all night so there's never a break. Happy to travel to the mountains and the coast.",
    hourlyRate: 1200,
    minHours: 3,
    travelRadiusKm: 400,
    genres: ["House", "Pop", "Disco"],
    eventTypes: ["wedding", "corporate", "private"],
    equipment: "Full rig and sound for 150 guests.",
    hue: 170,
    addons: [{ name: "Travel > 100 km", description: "Covers travel and accommodation", price: 2500, priceType: "fixed" }],
    demo: [{ title: "Northern lights disco", bpm: 120, rootHz: 207.7, swing: 0.06 }],
  },
];

const BOOKERS = [
  { name: "Demo Booker", email: "demo@gigga.se" },
  { name: "Anna Karlsson", email: "anna@demo.gigga.se" },
  { name: "Johan Ek", email: "johan@demo.gigga.se" },
  { name: "Sara Nilsson", email: "sara@demo.gigga.se" },
  { name: "Erik Holm", email: "erik@demo.gigga.se" },
];

const REVIEW_TEXTS = [
  [5, "Absolutely amazing night! The dance floor was packed from the first song to the last and everyone is asking who we booked."],
  [5, "Super professional from the first message. Listened to what we wanted and read the crowd perfectly."],
  [4, "Great vibe and easy communication. A bit loud at the start but sorted right away."],
  [5, "Booked through Gigga after listening to the mixes on the profile. Exactly as promised, will book again!"],
  [4, "Great music and lovely to deal with. The light package was worth every krona."],
  [5, "Our guests are still talking about the party. Thanks for a magical night!"],
] as const;

function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Clearing the database…");
  for (const table of [
    schema.messages,
    schema.reviews,
    schema.bookings,
    schema.blockedDates,
    schema.addons,
    schema.tracks,
    schema.artists,
    schema.users,
  ]) {
    await db.delete(table);
  }
  await rm(path.resolve(process.env.UPLOAD_DIR ?? "data/uploads"), { recursive: true, force: true });

  const passwordHash = await hash(PASSWORD, 10);

  const bookerIds = [];
  for (const b of BOOKERS) {
    const [row] = await db
      .insert(schema.users)
      .values({ ...b, passwordHash, role: "booker" })
      .returning({ id: schema.users.id });
    bookerIds.push(row!.id);
  }

  console.log("Creating artists and demo audio…");
  const artistRows: { id: string; seed: SeedArtist; addonIds: string[] }[] = [];
  for (const [index, a] of ARTISTS.entries()) {
    const city = findCity(a.city)!;
    const emailName = a.slug === "dj-nova" ? "nova" : a.slug;
    const [user] = await db
      .insert(schema.users)
      .values({ name: a.displayName, email: `${emailName}@demo.gigga.se`, passwordHash, role: "artist" })
      .returning({ id: schema.users.id });

    const [artist] = await db
      .insert(schema.artists)
      .values({
        userId: user!.id,
        slug: a.slug,
        displayName: a.displayName,
        category: a.category,
        tagline: a.tagline,
        bio: a.bio,
        city: city.name,
        lat: city.lat,
        lng: city.lng,
        travelRadiusKm: a.travelRadiusKm,
        hourlyRate: a.hourlyRate,
        minHours: a.minHours,
        genres: a.genres,
        eventTypes: a.eventTypes,
        equipment: a.equipment,
        avatarHue: a.hue,
        createdAt: new Date(Date.now() - (ARTISTS.length - index) * 86400000 * 7),
      })
      .returning({ id: schema.artists.id });

    const addonRows = a.addons.length
      ? await db
          .insert(schema.addons)
          .values(a.addons.map((addon) => ({ ...addon, artistId: artist!.id })))
          .returning({ id: schema.addons.id })
      : [];

    for (const demo of a.demo ?? []) {
      const key = await saveBuffer(renderDemoLoop({ ...demo, seconds: 20 }), "wav");
      await db.insert(schema.tracks).values({ artistId: artist!.id, title: demo.title, source: "upload", url: key });
    }

    artistRows.push({ id: artist!.id, seed: a, addonIds: addonRows.map((r) => r.id) });
  }

  console.log("Creating bookings and reviews…");
  let reviewIndex = 0;
  for (const [i, { id: artistId, seed }] of artistRows.entries()) {
    const reviewCount = [4, 3, 3, 2, 1, 2, 3, 2, 1, 3, 1, 2, 2, 1][i] ?? 1;
    for (let r = 0; r < reviewCount; r++) {
      const bookerIndex = 1 + ((i + r) % (BOOKERS.length - 1));
      const hours = seed.minHours + 1;
      const q = quote(seed, hours, []);
      const daysAgo = 20 + r * 35 + i * 3;
      const [booking] = await db
        .insert(schema.bookings)
        .values({
          artistId,
          bookerId: bookerIds[bookerIndex]!,
          eventDate: isoDate(-daysAgo),
          startTime: "19:00",
          hours: q.billableHours,
          eventType: seed.eventTypes[r % Math.max(seed.eventTypes.length, 1)] ?? "private",
          guests: 60 + r * 20,
          location: `${seed.city}`,
          performanceAmount: q.performance,
          addonsAmount: 0,
          serviceFee: q.serviceFee,
          total: q.total,
          status: "accepted",
          createdAt: new Date(Date.now() - (daysAgo + 30) * 86400000),
        })
        .returning({ id: schema.bookings.id });

      const [rating, body] = REVIEW_TEXTS[reviewIndex++ % REVIEW_TEXTS.length]!;
      await db.insert(schema.reviews).values({
        artistId,
        bookingId: booking!.id,
        authorName: BOOKERS[bookerIndex]!.name,
        rating,
        body,
        createdAt: new Date(Date.now() - (daysAgo - 2) * 86400000),
      });
    }
  }

  // DJ Nova gets live activity so both demo accounts have something to look at.
  const nova = artistRows[0]!;
  const novaUser = await db.query.artists.findFirst({ where: (t, { eq }) => eq(t.id, nova.id) });
  const demoBooker = bookerIds[0]!;
  const addonLookup = await db.query.addons.findMany({ where: (t, { eq }) => eq(t.artistId, nova.id) });

  const pendingQuote = quote(nova.seed, 5, addonLookup.slice(0, 2));
  const [pending] = await db
    .insert(schema.bookings)
    .values({
      artistId: nova.id,
      bookerId: demoBooker,
      eventDate: isoDate(45),
      startTime: "20:00",
      hours: pendingQuote.billableHours,
      eventType: "wedding",
      guests: 140,
      location: "Häringe Castle, Västerhaninge",
      message: "Hi! We're getting married and would love disco and house after dinner. Could you do the ceremony too?",
      addonLines: pendingQuote.addonLines,
      performanceAmount: pendingQuote.performance,
      addonsAmount: pendingQuote.addonsTotal,
      serviceFee: pendingQuote.serviceFee,
      total: pendingQuote.total,
    })
    .returning({ id: schema.bookings.id });
  await db.insert(schema.messages).values({
    bookingId: pending!.id,
    senderId: demoBooker,
    body: "Hi! We're getting married and would love disco and house after dinner. Could you do the ceremony too?",
  });

  const acceptedQuote = quote(nova.seed, 4, []);
  const [accepted] = await db
    .insert(schema.bookings)
    .values({
      artistId: nova.id,
      bookerId: bookerIds[2]!,
      eventDate: isoDate(12),
      startTime: "21:00",
      hours: acceptedQuote.billableHours,
      eventType: "corporate",
      guests: 80,
      location: "The office, Kungsgatan 12, Stockholm",
      performanceAmount: acceptedQuote.performance,
      addonsAmount: 0,
      serviceFee: acceptedQuote.serviceFee,
      total: acceptedQuote.total,
      status: "accepted",
    })
    .returning({ id: schema.bookings.id });
  await db.insert(schema.messages).values([
    { bookingId: accepted!.id, senderId: bookerIds[2]!, body: "Could you start with something mellower during the mingle?" },
    { bookingId: accepted!.id, senderId: novaUser!.userId, body: "Absolutely! I'll play lounge until 10 pm and then get the dance floor going." },
  ]);

  // A past booking without a review, so the demo booker can try leaving one.
  const pastQuote = quote(artistRows[6]!.seed, 4, []);
  await db.insert(schema.bookings).values({
    artistId: artistRows[6]!.id,
    bookerId: demoBooker,
    eventDate: isoDate(-9),
    startTime: "19:00",
    hours: pastQuote.billableHours,
    eventType: "birthday",
    guests: 45,
    location: "Gothenburg",
    performanceAmount: pastQuote.performance,
    addonsAmount: 0,
    serviceFee: pastQuote.serviceFee,
    total: pastQuote.total,
    status: "accepted",
  });

  await db.insert(schema.blockedDates).values([
    { artistId: nova.id, date: isoDate(19) },
    { artistId: nova.id, date: isoDate(20) },
  ]);

  console.log(`Done! ${ARTISTS.length} artists, ${BOOKERS.length} bookers. Password for every account: ${PASSWORD}`);
  console.log("  Booker: demo@gigga.se");
  console.log("  Artist: nova@demo.gigga.se");
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
