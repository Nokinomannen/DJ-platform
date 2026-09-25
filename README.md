# Gigga

A booking marketplace for DJs, live musicians, sound & lights and party planners. Think Airbnb, but for the music at your party: find artists near you on a map, listen to real sets right on their profile, build the booking with add-ons like a PA and lights, and send a request with a fixed price. Artists get a profile that replaces the Instagram bio and the DM inbox.

"Gigga" is a working name.

## Try it without a terminal

Open the repo in GitHub Codespaces. Everything installs, the demo data loads and the app starts on its own:

**https://codespaces.new/Nokinomannen/DJ-platform?ref=claude/dreamy-ramanujan-su6mqc**

When it's ready a preview opens. If it doesn't, open the **Ports** tab and click the globe next to port 3000.

## Run locally

Requires Node 20.9 or later.

```bash
npm install
cp .env.example .env.local
npm run setup   # creates the database and loads demo data
npm run dev
```

Open http://localhost:3000. Every demo account uses the password `gigga1234`:

| Account | Role |
| --- | --- |
| `demo@gigga.se` | Booker with a pending request and a completed booking to review |
| `nova@demo.gigga.se` | DJ Nova, with incoming requests, chat and blocked dates |

`npm run db:seed` resets all data, including uploaded files.

## What's in the MVP

**For bookers**
- Airbnb-style search: results on the left, a map with price pins on the right. Hovering a card highlights its pin, clicking a pin opens a mini card, and "Search this area" searches wherever you've moved the map. On mobile, a "Show map" button toggles between list and map.
- Search by city or "Near me" (browser location). Results are sorted by distance and only include artists willing to travel that far.
- Filter by category, genre, max hourly price, max distance and available date. Artists who blocked the date or already have a confirmed booking are hidden.
- Artist profile with an audio player for uploaded clips and embedded players for SoundCloud, Mixcloud, YouTube and Spotify.
- Booking card with a live price: hourly rate × hours (at least the artist's minimum), chosen add-ons and a service fee.
- Booking page with status, chat, and a review after the event.

**For artists**
- Profile with photo, bio, genres, event types, home city, travel radius, hourly rate and what's included.
- Sound: upload MP3/M4A/WAV/OGG (max 25 MB) or link mixes.
- Add-ons with a fixed or hourly price (extra PA, light package, ceremony music).
- Block dates. Confirmed bookings block dates automatically.
- Dashboard with new requests, upcoming gigs and booked value. Confirm or decline in one click.

**Trust**
- Reviews can only be left by the booker, after a confirmed booking whose date has passed, and are marked as verified.
- Map pins show an approximate location (offset 1–3.5 km from the city centre), never an artist's exact address.
- Prices are always recalculated on the server from the artist's current add-ons. Each booking stores a snapshot of its price lines so later price changes don't rewrite history.

## Tech

- **Next.js 16** (App Router, Server Components, Server Actions), React 19, TypeScript
- **Tailwind CSS 4**
- **Leaflet** via react-leaflet with CARTO dark map tiles (OpenStreetMap data, no API key)
- **Drizzle ORM + libSQL/SQLite**: a local file in development, [Turso](https://turso.tech) or another libSQL server in production via `DATABASE_URL` and `DATABASE_AUTH_TOKEN`
- **Auth**: email and password (bcrypt), with the session in a signed httpOnly cookie (JWT via `jose`)
- **Uploads**: local disk under `data/uploads`, served through `/api/media/[key]` with Range support so the audio player can seek
- **Vitest** unit tests for pricing, geo and embed links

```
src/
  app/                 pages and route handlers
  components/          shared UI
    search/            split list + map search view
  lib/
    actions/           Server Actions (auth, booking, profile, sound)
    auth/session.ts    session handling
    db/schema.ts       database schema
    queries.ts         search and data access
    pricing.ts         price calculation, shared by client and server
    geo.ts             cities, distances, approximate pins, map bounds
    embeds.ts          SoundCloud/Mixcloud/YouTube/Spotify links to players
scripts/               migrations, seed and synthesised demo audio
drizzle/               generated SQL migrations
```

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Starts the dev server |
| `npm run build` / `npm start` | Production build and server (requires `SESSION_SECRET`) |
| `npm test` | Unit tests |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run db:generate` | Generates a migration after changing `schema.ts` |
| `npm run db:migrate` | Runs migrations |
| `npm run db:seed` | Resets the database to demo data |
| `npm run db:studio` | Opens Drizzle Studio |

## Before a real launch

The MVP is built to validate the idea, not for production. Still missing:

1. **Payments.** Stripe Connect (or Swish for businesses) with a deposit on confirmation and payout to the artist after the event. Without payments on the platform, people move off it after the first booking.
2. **Cloud file storage.** Swap `src/lib/storage.ts` for S3, Cloudflare R2 or Supabase Storage. Local disk doesn't work on serverless hosting.
3. **Notifications.** Email (e.g. Resend) when a request comes in, gets answered or gets a new message.
4. **Accounts.** Email verification, password reset and rate limiting on login.
5. **Geo.** Real address and postcode search (geocoding) instead of the city list, and PostGIS or similar as the number of artists grows. Distance filtering currently happens in memory.
6. **Terms.** Cancellation policy, contracts between booker and artist, GDPR and terms of service.
7. **Map tiles at scale.** CARTO's free basemaps have usage limits; switch to a paid tile provider (MapTiler, Mapbox, Stadia) before launch.
