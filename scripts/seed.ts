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
    tagline: "Bröllops- och företags-DJ som läser av dansgolvet från första låten",
    bio: "Jag har spelat på över 300 bröllop, julfester och releasefester sedan 2014. Mitt fokus är att hela sällskapet ska dansa, från kusinerna till mormor.\n\nVi går igenom önskelistor och no-go-låtar innan festen, och jag har alltid med mikrofon för tal.",
    hourlyRate: 1800,
    minHours: 3,
    travelRadiusKm: 120,
    genres: ["House", "Disco", "Pop", "80-tal", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "birthday", "private"],
    equipment: "Pioneer CDJ-3000 × 2 och DJM-900NXS2\nTvå RCF-högtalare, räcker till ca 120 gäster\nTrådlös mikrofon för tal",
    hue: 285,
    addons: [
      { name: "Extra PA för 120–300 gäster", description: "Två toppar + subbas", price: 2500, priceType: "fixed" },
      { name: "Ljuspaket", description: "4 moving heads, rökmaskin och uplights", price: 1800, priceType: "fixed" },
      { name: "Ceremonimusik", description: "Separat ljud för vigseln", price: 1500, priceType: "fixed" },
    ],
    demo: [
      { title: "Bröllopsmix – disco & house", bpm: 122, rootHz: 220, swing: 0.08, minor: false },
      { title: "Sen kväll – deep house", bpm: 118, rootHz: 196 },
    ],
  },
  {
    slug: "mira-b",
    displayName: "Mira B",
    category: "dj",
    city: "Stockholm",
    tagline: "Hip hop, R&B och afrobeats för klubbar och födelsedagar",
    bio: "Resident på två klubbar på Södermalm. Spelar allt från 00-tals R&B till ny afrobeats och amapiano. Perfekt när du vill att festen ska kännas som en klubbkväll.",
    hourlyRate: 1400,
    minHours: 3,
    travelRadiusKm: 60,
    genres: ["Hip hop", "R&B", "Afrobeats", "Dancehall"],
    eventTypes: ["club", "birthday", "student", "private"],
    equipment: "Eget DJ-bord (Rane Seventy + Technics). Ljudanläggning hyrs som tillägg.",
    hue: 330,
    addons: [
      { name: "PA-system upp till 150 gäster", price: 2200, priceType: "fixed" },
      { name: "MC/hypeman", description: "Kvällens hypeman från mitt crew", price: 600, priceType: "per_hour" },
    ],
    demo: [{ title: "R&B-favoriter – 95 bpm", bpm: 95, rootHz: 174.6, swing: 0.2 }],
  },
  {
    slug: "soulsystem",
    displayName: "Soulsystem",
    category: "band",
    city: "Stockholm",
    tagline: "Femmannaband med funk, soul och allsångsvänlig pop",
    bio: "Sång, gitarr, bas, trummor och keys. Vi spelar två set à 45 minuter och har DJ-spellista mellan seten. Över 150 bröllop och företagsfester.",
    hourlyRate: 4800,
    minHours: 2,
    travelRadiusKm: 200,
    genres: ["Funk & soul", "Pop", "80-tal", "Disco"],
    eventTypes: ["wedding", "corporate"],
    equipment: "Komplett ljudanläggning och ljudtekniker för upp till 250 gäster.",
    hue: 25,
    addons: [
      { name: "Blåssektion", description: "Trumpet + sax", price: 6000, priceType: "fixed" },
      { name: "Akustiskt mingelset", description: "Duo under middagen", price: 3500, priceType: "fixed" },
    ],
    demo: [{ title: "Livemedley (demo)", bpm: 108, rootHz: 146.8, swing: 0.15, minor: false }],
  },
  {
    slug: "kasper-lind",
    displayName: "Kasper Lind",
    category: "musician",
    city: "Stockholm",
    tagline: "Live-sax ovanpå DJ-set, eller jazz till mingel",
    bio: "Saxofonist som spelar live tillsammans med DJ:n. Funkar lika bra till mingel med lugn jazz som till en fullsatt dansgolvspeak.",
    hourlyRate: 1200,
    minHours: 1,
    travelRadiusKm: 80,
    genres: ["House", "Jazz", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "club"],
    equipment: "Trådlös mikrofon för sax och in-ear. Kopplas in i DJ:ns mixer.",
    hue: 45,
    addons: [{ name: "Egen PA för mingel", price: 900, priceType: "fixed" }],
    demo: [{ title: "Sax x house", bpm: 120, rootHz: 233.1, swing: 0.1 }],
  },
  {
    slug: "nordljud",
    displayName: "Nordljud",
    category: "sound",
    city: "Stockholm",
    tagline: "Hyr ljud, ljus och tekniker till allt från 20 till 800 gäster",
    bio: "Vi levererar, riggar och plockar ner. Du bokar per timme och lägger till tekniker eller scen efter behov.",
    hourlyRate: 900,
    minHours: 4,
    travelRadiusKm: 150,
    genres: [],
    eventTypes: ["wedding", "corporate", "private", "student"],
    equipment: "PA för upp till 200 gäster, mixerbord, två trådlösa mikrofoner, leverans och rigg.",
    hue: 200,
    addons: [
      { name: "Ljudtekniker på plats", price: 450, priceType: "per_hour" },
      { name: "Scen 4 × 3 m", price: 3500, priceType: "fixed" },
      { name: "Ljuspaket stort", description: "8 moving heads + hazer", price: 4000, priceType: "fixed" },
    ],
  },
  {
    slug: "festfabriken",
    displayName: "Festfabriken",
    category: "planner",
    city: "Stockholm",
    tagline: "Vi fixar helheten: lokal, musik, mat och tidsplan",
    bio: "Festfixare för bröllop, jubileum och företagsfester. Vi hittar lokal, bokar artister och håller i tidsplanen under kvällen så att du kan vara gäst på din egen fest.",
    hourlyRate: 1100,
    minHours: 5,
    travelRadiusKm: 100,
    genres: [],
    eventTypes: ["wedding", "corporate", "birthday"],
    equipment: "Projektledning före och under eventet.",
    hue: 160,
    addons: [
      { name: "Toastmaster", price: 3000, priceType: "fixed" },
      { name: "Dekor & blommor", price: 5000, priceType: "fixed" },
    ],
  },
  {
    slug: "dj-kustbris",
    displayName: "DJ Kustbris",
    category: "dj",
    city: "Göteborg",
    tagline: "Schlager, 80-tal och allsång, västkustens festgaranti",
    bio: "När ni vill ha en fest där alla sjunger med. Jag är expert på 40-, 50- och 60-årsfester och tar med rätt låtar för varje generation.",
    hourlyRate: 1100,
    minHours: 4,
    travelRadiusKm: 100,
    genres: ["Schlager", "Pop", "80-tal"],
    eventTypes: ["birthday", "wedding", "private"],
    equipment: "Komplett DJ-rigg och ljud för upp till 100 gäster. Mikrofon ingår.",
    hue: 190,
    addons: [
      { name: "Discoljus", price: 800, priceType: "fixed" },
      { name: "Karaokepaket", description: "Skärm + två mikrofoner", price: 1200, priceType: "fixed" },
    ],
    demo: [{ title: "Allsångsmix", bpm: 128, rootHz: 261.6, minor: false }],
  },
  {
    slug: "techno-tove",
    displayName: "Techno Tove",
    category: "dj",
    city: "Göteborg",
    tagline: "Techno och house för klubbkvällar och afterparties",
    bio: "Har spelat på festivaler och klubbar i hela Norden. Bokas för klubbar, releasefester och privata afterparties som ska kännas som Berlin.",
    hourlyRate: 1600,
    minHours: 2,
    travelRadiusKm: 500,
    genres: ["Techno", "House", "Drum & bass"],
    eventTypes: ["club", "private"],
    equipment: "USB/CDJ-set, kräver DJ-bord på plats eller tillägg.",
    hue: 260,
    addons: [{ name: "DJ-bord + monitor", price: 1500, priceType: "fixed" }],
    demo: [
      { title: "Peak time techno", bpm: 132, rootHz: 110 },
      { title: "Warm-up house", bpm: 124, rootHz: 130.8 },
    ],
  },
  {
    slug: "vastkust-live",
    displayName: "Västkust Live",
    category: "band",
    city: "Göteborg",
    tagline: "Akustisk trio för vigsel, middag och dans",
    bio: "Sång, gitarr och cajón. Vi anpassar oss efter kvällen, från vigselmusik till dansbara covers.",
    hourlyRate: 3200,
    minHours: 2,
    travelRadiusKm: 150,
    genres: ["Pop", "Akustiskt", "Funk & soul"],
    eventTypes: ["wedding", "corporate", "private"],
    equipment: "Eget ljud för upp till 120 gäster.",
    hue: 15,
    addons: [{ name: "Vigselmusik", description: "3 låtar under ceremonin", price: 2500, priceType: "fixed" }],
    demo: [{ title: "Akustisk demo", bpm: 96, rootHz: 196, swing: 0.25, minor: false }],
  },
  {
    slug: "salsa-samuel",
    displayName: "Salsa Samuel",
    category: "dj",
    city: "Malmö",
    tagline: "Latin, reggaeton och afrobeats som får alla att röra sig",
    bio: "Född i Bogotá, uppvuxen i Malmö. Specialist på latinska fester, bröllop med internationella gäster och sommarfester.",
    hourlyRate: 1300,
    minHours: 3,
    travelRadiusKm: 90,
    genres: ["Latin", "Reggaeton", "Afrobeats", "Pop"],
    eventTypes: ["wedding", "birthday", "club", "private"],
    equipment: "DJ-rigg och högtalare för upp till 80 gäster.",
    hue: 5,
    addons: [
      { name: "Salsalektion för gästerna", description: "30 min med dansinstruktör", price: 1500, priceType: "fixed" },
      { name: "Större PA", price: 1800, priceType: "fixed" },
    ],
    demo: [{ title: "Reggaeton set", bpm: 98, rootHz: 164.8, swing: 0.12 }],
  },
  {
    slug: "oresund-sound",
    displayName: "Öresund Sound",
    category: "sound",
    city: "Malmö",
    tagline: "Ljud- och ljusuthyrning i Skåne, med leverans",
    bio: "Vi hyr ut allt från ett enkelt mingelljud till kompletta festivalriggar i hela Skåne.",
    hourlyRate: 800,
    minHours: 3,
    travelRadiusKm: 120,
    genres: [],
    eventTypes: ["wedding", "corporate", "student", "private"],
    equipment: "PA för 100 gäster, mixer, två mikrofoner. Leverans i Malmö/Lund ingår.",
    hue: 210,
    addons: [
      { name: "Tekniker", price: 400, priceType: "per_hour" },
      { name: "Uplights × 8", price: 900, priceType: "fixed" },
    ],
  },
  {
    slug: "linnea-sjoberg",
    displayName: "Linnea Sjöberg",
    category: "musician",
    city: "Malmö",
    tagline: "Sång och piano till vigsel, middag och mingel",
    bio: "Utbildad på Musikhögskolan i Malmö. Jag sjunger allt från Laleh och Adele till jazzstandards och anpassar repertoaren efter er.",
    hourlyRate: 1500,
    minHours: 1,
    travelRadiusKm: 150,
    genres: ["Akustiskt", "Jazz", "Pop"],
    eventTypes: ["wedding", "corporate"],
    equipment: "Stagepiano och ljud för upp till 80 gäster.",
    hue: 340,
    addons: [{ name: "Önskelåt inlärd", price: 800, priceType: "fixed" }],
    demo: [{ title: "Pianoballad (demo)", bpm: 76, rootHz: 261.6, minor: false }],
  },
  {
    slug: "dj-fyris",
    displayName: "DJ Fyris",
    category: "dj",
    city: "Uppsala",
    tagline: "Studentfester, nationsfester och födelsedagar till studentpris",
    bio: "Spelar på nationerna varje helg. Billigast i stan för sittningar och studentfester, men lika gärna på din 30-årsfest.",
    hourlyRate: 950,
    minHours: 3,
    travelRadiusKm: 80,
    genres: ["Pop", "Hip hop", "80-tal", "Schlager"],
    eventTypes: ["student", "birthday", "private"],
    equipment: "Controller och högtalare för upp till 70 gäster.",
    hue: 100,
    addons: [{ name: "Ljusslinga + strobe", price: 500, priceType: "fixed" }],
    demo: [{ title: "Nationsmix", bpm: 126, rootHz: 185, minor: false }],
  },
  {
    slug: "norrsken-djs",
    displayName: "Norrsken DJs",
    category: "dj",
    city: "Umeå",
    tagline: "DJ-duo som reser i hela Norrland",
    bio: "Två DJs som turas om hela kvällen så att det aldrig blir paus. Vi reser gärna till fjällen och kusten.",
    hourlyRate: 1200,
    minHours: 3,
    travelRadiusKm: 400,
    genres: ["House", "Pop", "Disco"],
    eventTypes: ["wedding", "corporate", "private"],
    equipment: "Komplett rigg och ljud för 150 gäster.",
    hue: 170,
    addons: [{ name: "Resa > 100 km", description: "Täcker resa och boende", price: 2500, priceType: "fixed" }],
    demo: [{ title: "Norrskensdisco", bpm: 120, rootHz: 207.7, swing: 0.06 }],
  },
];

const BOOKERS = [
  { name: "Demo Bokare", email: "demo@gigga.se" },
  { name: "Anna Karlsson", email: "anna@demo.gigga.se" },
  { name: "Johan Ek", email: "johan@demo.gigga.se" },
  { name: "Sara Nilsson", email: "sara@demo.gigga.se" },
  { name: "Erik Holm", email: "erik@demo.gigga.se" },
];

const REVIEW_TEXTS = [
  [5, "Helt fantastisk kväll! Dansgolvet var fullt från första till sista låten och alla frågar vem vi bokade."],
  [5, "Superproffsigt från första kontakt. Lyssnade på våra önskemål och läste av publiken perfekt."],
  [4, "Väldigt bra stämning och smidig kommunikation. Lite för högt i början men löstes direkt."],
  [5, "Bokade via Gigga efter att ha lyssnat på mixarna i profilen. Precis som utlovat, bokar igen!"],
  [4, "Bra musik och trevligt bemötande. Ljuspaketet var värt varenda krona."],
  [5, "Gästerna pratar fortfarande om festen. Tack för en magisk kväll!"],
] as const;

function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Rensar databasen…");
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

  console.log("Skapar artister och demo-ljud…");
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

  console.log("Skapar bokningar och omdömen…");
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
      location: "Häringe Slott, Västerhaninge",
      message: "Hej! Vi gifter oss och vill ha disco och house efter middagen. Går det att köra ceremonin också?",
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
    body: "Hej! Vi gifter oss och vill ha disco och house efter middagen. Går det att köra ceremonin också?",
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
      location: "Kontoret, Kungsgatan 12, Stockholm",
      performanceAmount: acceptedQuote.performance,
      addonsAmount: 0,
      serviceFee: acceptedQuote.serviceFee,
      total: acceptedQuote.total,
      status: "accepted",
    })
    .returning({ id: schema.bookings.id });
  await db.insert(schema.messages).values([
    { bookingId: accepted!.id, senderId: bookerIds[2]!, body: "Kan du börja med lite lugnare musik under minglet?" },
    { bookingId: accepted!.id, senderId: novaUser!.userId, body: "Absolut! Jag kör lounge till 22 och drar sedan igång dansgolvet." },
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
    location: "Göteborg",
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

  console.log(`Klart! ${ARTISTS.length} artister, ${BOOKERS.length} bokare. Lösenord för alla konton: ${PASSWORD}`);
  console.log("  Bokare: demo@gigga.se");
  console.log("  Artist: nova@demo.gigga.se");
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
