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
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time."),
  hours: z.coerce.number().int().min(MIN_BOOKING_HOURS).max(MAX_BOOKING_HOURS),
  eventType: z.enum(EVENT_TYPES.map((e) => e.id) as [string, ...string[]], "Pick an event type."),
  guests: z.coerce.number("Enter the number of guests.").int().min(1, "Enter the number of guests.").max(10000),
  location: z.string().trim().min(2, "Enter the event location.").max(160),
  message: z.string().trim().max(2000).default(""),
});

export async function requestBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to send a request." };

  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  if (input.eventDate < todayInSweden()) return { error: "That date has already passed." };

  const artist = await db.query.artists.findFirst({
    where: and(eq(artists.id, input.artistId), eq(artists.published, true)),
  });
  if (!artist) return { error: "This artist is no longer available." };
  if (artist.userId === user.id) return { error: "You can't book yourself." };
  if (!(await isArtistAvailable(artist.id, input.eventDate))) {
    return { error: "Sorry, the artist is busy on that date." };
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
  if (!user) return { error: "You're not logged in." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isArtist) return { error: "You're not allowed to reply to this request." };
  if (data.booking.status !== "pending") return { error: "This request has already been answered." };

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
    if (clash) return { error: "You already have a confirmed booking on that date." };
  }

  await db
    .update(bookings)
    .set({ status: decision })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "pending")));

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  return { ok: decision === "accepted" ? "Booking confirmed." : "Request declined." };
}

export async function cancelBooking(bookingId: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You're not logged in." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isBooker) return { error: "Only the person who booked can cancel." };
  const { status, eventDate } = data.booking;
  if (status !== "pending" && status !== "accepted") return { error: "This booking can't be cancelled." };
  if (eventDate < todayInSweden()) return { error: "The event has already happened." };

  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId));
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  return { ok: "Booking cancelled." };
}

const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

export async function sendMessage(bookingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You're not logged in." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data) return { error: "Booking not found." };

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await db.insert(messages).values({ bookingId, senderId: user.id, body: parsed.data.body });
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: "Sent." };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  body: z.string().trim().min(10, "Write at least a few words.").max(1500),
});

export async function submitReview(bookingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You're not logged in." };
  const data = await getBookingForUser(bookingId, user.id);
  if (!data?.isBooker) return { error: "Only the person who booked can leave a review." };
  if (data.booking.status !== "accepted" || data.booking.eventDate >= todayInSweden()) {
    return { error: "You can leave a review after the event." };
  }
  if (data.review) return { error: "You've already left a review." };

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
  return { ok: "Thanks for your review!" };
}
