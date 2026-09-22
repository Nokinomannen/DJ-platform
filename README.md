# Gigga

Bokningsplattform för DJs, livemusiker, ljud & ljus och festfixare. Tänk Airbnb, fast för musiken till festen: hitta artister nära dig, lyssna på riktiga set direkt i profilen, bygg ihop bokningen med tillägg som PA och ljus, och skicka en förfrågan med fast pris. Artisterna får en profil som ersätter Instagram-bion och DM-inkorgen.

"Gigga" är ett arbetsnamn.

## Kom igång

Kräver Node 20.9 eller senare.

```bash
npm install
cp .env.example .env.local
npm run setup   # skapar databasen och fyller den med demodata
npm run dev
```

Öppna http://localhost:3000. Alla demokonton har lösenordet `gigga1234`:

| Konto | Roll |
| --- | --- |
| `demo@gigga.se` | Bokare, har en väntande förfrågan och en genomförd bokning att betygsätta |
| `nova@demo.gigga.se` | DJ Nova, har inkommande förfrågningar, chatt och blockerade datum |

`npm run db:seed` återställer all data, inklusive uppladdade filer.

## Vad som finns i MVP:n

**För bokare**
- Sök på stad eller "Nära mig" (webbläsarens plats). Resultaten sorteras efter avstånd och visar bara artister som är villiga att resa så långt.
- Filter på kategori, genre, maxpris per timme, maxavstånd och ledigt datum. Artister som blockerat datumet eller redan har en bekräftad bokning då döljs.
- Artistprofil med ljudspelare för uppladdade klipp och inbäddade spelare för SoundCloud, Mixcloud, YouTube och Spotify.
- Bokningskort med live-prisuträkning: timpris × timmar (minst artistens minimum), valda tillägg och serviceavgift.
- Bokningssida med status, chatt och omdöme efter genomfört event.

**För artister**
- Profil med bild, bio, genrer, tillfällen, hemstad, reseradie, timpris och vad som ingår.
- Ljud: ladda upp MP3/M4A/WAV/OGG (max 25 MB) eller länka mixar.
- Tillägg med fast pris eller timpris (extra PA, ljuspaket, ceremonimusik).
- Blockera datum. Bekräftade bokningar blockerar automatiskt.
- Dashboard med nya förfrågningar, kommande spelningar och bokat värde. Bekräfta eller neka med ett klick.

**Förtroende**
- Omdömen kan bara lämnas av bokaren efter en bekräftad bokning vars datum har passerat, och märks som verifierade.
- Priset räknas alltid om på servern från artistens aktuella tillägg. Bokningen sparar en ögonblicksbild av prisraderna så att senare prisändringar inte skriver om historiken.

## Teknik

- **Next.js 16** (App Router, Server Components, Server Actions), React 19, TypeScript
- **Tailwind CSS 4**
- **Drizzle ORM + libSQL/SQLite**: lokal fil i utveckling, [Turso](https://turso.tech) eller annan libSQL-server i produktion via `DATABASE_URL` och `DATABASE_AUTH_TOKEN`
- **Auth**: e-post och lösenord (bcrypt), sessionen ligger i en signerad httpOnly-cookie (JWT via `jose`)
- **Uppladdningar**: lokal disk under `data/uploads`, serveras via `/api/media/[key]` med stöd för Range-requests så att ljudspelaren kan spola
- **Vitest** för enhetstester av prissättning, geo och inbäddningslänkar

```
src/
  app/                 sidor och route handlers
  components/          delade UI-komponenter
  lib/
    actions/           Server Actions (auth, bokning, profil, ljud)
    auth/session.ts    sessionshantering
    db/schema.ts       databasschema
    queries.ts         sök och dataåtkomst
    pricing.ts         prisuträkning, delas av klient och server
    geo.ts             städer och avståndsberäkning
    embeds.ts          SoundCloud/Mixcloud/YouTube/Spotify-länkar till spelare
scripts/               migrering, seed och syntetiskt demoljud
drizzle/               genererade SQL-migreringar
```

## Kommandon

| Kommando | Gör |
| --- | --- |
| `npm run dev` | Startar utvecklingsservern |
| `npm run build` / `npm start` | Produktionsbygge och server (kräver `SESSION_SECRET`) |
| `npm test` | Enhetstester |
| `npm run lint` / `npm run typecheck` | ESLint och TypeScript |
| `npm run db:generate` | Genererar en ny migrering efter ändring i `schema.ts` |
| `npm run db:migrate` | Kör migreringar |
| `npm run db:seed` | Återställer databasen till demodata |
| `npm run db:studio` | Öppnar Drizzle Studio |

## Innan skarp lansering

MVP:n är byggd för att validera idén, inte för produktion. Det här saknas:

1. **Betalning.** Stripe Connect (eller Swish för företag) med deposition vid bekräftelse och utbetalning till artisten efter eventet. Utan betalning i plattformen tar folk kontakten utanför efter första bokningen.
2. **Filer i molnet.** Byt `src/lib/storage.ts` mot S3, Cloudflare R2 eller Supabase Storage. Lokal disk fungerar inte på serverless-hosting.
3. **Notiser.** E-post (t.ex. Resend) när en förfrågan kommer in, besvaras eller får ett nytt meddelande.
4. **Konto.** E-postverifiering, glömt lösenord och rate limiting på inloggning.
5. **Geo.** Riktig adress- och postnummersökning (geokodning) i stället för stadslistan, och PostGIS eller liknande när antalet artister växer. Idag filtreras avstånd i minnet.
6. **Villkor.** Avbokningsregler, avtal mellan bokare och artist, GDPR och användarvillkor.
7. **Kartvy** i sökresultaten och en riktig tillgänglighetskalender.
