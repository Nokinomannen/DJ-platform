"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { EVENT_TYPES } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { todayInSweden } from "@/lib/format";
import { firstIssue, type FormState } from "@/lib/form-state";
import { MAX_BOOKING_HOURS, MIN_BOOKING_HOURS, quote } from "@/lib/pricing";
import { getArtistAddons, getBookingForUser, isArtistAvailable } from "@/lib/queries";

const { bookings, artists, messages, reviews } = schema;

const bookingSchema = z.object({
  artistId: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Välj ett datum."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Välj en starttid."),
  hours: z.coerce.number().int().min(MIN_BOOKING_HOURS).max(MAX_BOOKING_HOURS),
  eventType: z.enum(EVENT_TYPES.map((e) => e.id) as [string, ...string[]], "Välj typ av event."),
  guests: z.coerce.number("Ange antal gäster.").int().min(1, "Ange antal gäster.").max(10000),
  location: z.string().trim().min(2, "Ange plats för eventet.").max(160),
  message: z.string().trim().max(2000).default(""),
});

export async function requestBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Logga in för att skicka en förfrågan." };

  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  if (input.eventDate < todayInSweden()) return { error: "Datumet har redan passerat." };

  const artist = await db.query.artists.findFirst({
    where: and(eq(artists.id, input.artistId), eq(artists.published, true)),
  });
  if (!artist) return { error: "Artisten finns inte längre." };
  if (artist.userId === user.id) return { error: "Du kan inte boka dig själv." };
  if (!(await isArtistAvailable(artist.id, input.eventDate))) {
    return { error: "Artisten är tyvärr upptagen det datumet." };
  }

  // Prices are always recomputed server-side from the artist's current add-ons.
  const addonIds = formData.getAll("addonIds").map(String);
  const selectedAddons = await getArtistAddons(artist.id, addonIds);
  const q = quote(artist, input.hours, selectedAddons);

  const [booking] = await db
    .insert(bookings)
    .values({
      artistId: artist.id,
      bookerId: user.id,
      eventDate: input.eventDate,
      startTime: input.startTime,
      hours: q.billableHours,
      eventType: input.eventType,
      guests: input.guests,
      location: input.location,
      message: input.message,
      addonLines: q.addonLines,
      performanceAmount: q.performance,
      addonsAmount: q.addonsTotal,
      serviceFee: q.serviceFee,
      total: q.total,
    })
    .returning({ id: bookings.id });

  if (input.message) {
    await db.insert(messages).values({ bookingId: booking!.id, senderId: user.id, body: input.message });
  }

  revalidatePath("/dashboard");
  redirect(`/bookings/${booking!.id}`);
}

export async function respondToBooking(
  bookingId: string,
  decision: "accepted" | "declined",
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du är inte inloggad." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isArtist) return { error: "Du har inte behörighet att svara på den här förfrågan." };
  if (data.booking.status !== "pending") return { error: "Förfrågan är redan besvarad." };

  if (decision === "accepted") {
    const [clash] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, data.artist.id),
          eq(bookings.eventDate, data.booking.eventDate),
          eq(bookings.status, "accepted"),
          ne(bookings.id, bookingId),
        ),
      );
    if (clash) return { error: "Du har redan en bekräftad bokning det datumet." };
  }

  await db
    .update(bookings)
    .set({ status: decision })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "pending")));

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  return { ok: decision === "accepted" ? "Bokningen är bekräftad." : "Förfrågan är nekad." };
}

export async function cancelBooking(bookingId: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du är inte inloggad." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isBooker) return { error: "Bara den som bokat kan avboka." };
  const { status, eventDate } = data.booking;
  if (status !== "pending" && status !== "accepted") return { error: "Bokningen kan inte avbokas." };
  if (eventDate < todayInSweden()) return { error: "Eventet har redan varit." };

  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId));
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  return { ok: "Bokningen är avbokad." };
}

const messageSchema = z.object({
  body: z.string().trim().min(1, "Skriv ett meddelande.").max(2000),
});

export async function sendMessage(bookingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du är inte inloggad." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data) return { error: "Bokningen hittades inte." };

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await db.insert(messages).values({ bookingId, senderId: user.id, body: parsed.data.body });
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: "Skickat." };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Välj betyg.").max(5),
  body: z.string().trim().min(10, "Skriv minst några ord.").max(1500),
});

export async function submitReview(bookingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du är inte inloggad." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isBooker) return { error: "Bara den som bokat kan lämna omdöme." };
  if (data.booking.status !== "accepted" || data.booking.eventDate >= todayInSweden()) {
    return { error: "Du kan lämna omdöme efter genomfört event." };
  }
  if (data.review) return { error: "Du har redan lämnat ett omdöme." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await db.insert(reviews).values({
    artistId: data.artist.id,
    bookingId,
    authorName: user.name,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/artists/${data.artist.slug}`);
  return { ok: "Tack för ditt omdöme!" };
}
