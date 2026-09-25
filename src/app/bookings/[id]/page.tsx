import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/booking-list";
import { Stars } from "@/components/stars";
import { cancelBooking, respondToBooking, sendMessage, submitReview } from "@/lib/actions/booking";
import { requireUser } from "@/lib/auth/session";
import { categoryLabel, eventTypeLabel } from "@/lib/constants";
import { formatDate, formatDateTime, formatSek, todayInSweden } from "@/lib/format";
import { getBookingForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage(props: PageProps<"/bookings/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/bookings/${id}`);
  const data = await getBookingForUser(id, user.id);
  if (!data) notFound();

  const { booking, artist, bookerName, isArtist, isBooker, thread, review } = data;
  const today = todayInSweden();
  const isPast = booking.eventDate < today;
  const canCancel = isBooker && !isPast && (booking.status === "pending" || booking.status === "accepted");
  const canReview = isBooker && isPast && booking.status === "accepted" && !review;
  const canMessage = booking.status === "pending" || booking.status === "accepted";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Back
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={artist.displayName}
            hue={artist.avatarHue}
            imageKey={artist.imageKey}
            className="size-16 rounded-2xl"
            textClassName="text-xl"
          />
          <div>
            <p className="text-sm text-muted">
              {isArtist ? `Request from ${bookerName}` : `${categoryLabel(artist.category)}`}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              <Link href={`/artists/${artist.slug}`} className="hover:text-accent">
                {artist.displayName}
              </Link>
            </h1>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {isArtist && booking.status === "pending" && (
            <div className="card flex flex-col gap-4 border-accent/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Reply to this request</p>
                <p className="text-sm text-muted">The booker is notified right away. Confirmed dates are blocked in your calendar.</p>
              </div>
              <div className="flex gap-2">
                <ActionForm action={respondToBooking.bind(null, booking.id, "declined")}>
                  <SubmitButton className="btn-secondary" pendingText="…">
                    Decline
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={respondToBooking.bind(null, booking.id, "accepted")}>
                  <SubmitButton pendingText="Confirming…">Confirm</SubmitButton>
                </ActionForm>
              </div>
            </div>
          )}

          {canReview && (
            <ActionForm action={submitReview.bind(null, booking.id)} className="card space-y-4 border-accent/40 p-5">
              <div>
                <p className="font-semibold">How was it?</p>
                <p className="text-sm text-muted">Your review shows as verified on {artist.displayName}’s profile.</p>
              </div>
              <fieldset className="flex flex-row-reverse justify-end gap-1 text-2xl">
                <legend className="sr-only">Rating</legend>
                {[5, 4, 3, 2, 1].map((n) => (
                  <label
                    key={n}
                    className="cursor-pointer text-border hover:text-accent has-[:checked]:text-accent [&:has(:checked)~label]:text-accent [&:hover~label]:text-accent"
                  >
                    <input type="radio" name="rating" value={n} required className="sr-only" />
                    <span aria-label={`${n} stars`}>★</span>
                  </label>
                ))}
              </fieldset>
              <textarea
                name="body"
                rows={3}
                required
                minLength={10}
                placeholder="What was best? Would you book again?"
                className="input"
              />
              <SubmitButton pendingText="Sending…">Submit review</SubmitButton>
            </ActionForm>
          )}

          {review && (
            <div className="card p-5">
              <p className="label">Your review · shown on {artist.displayName}’s profile</p>
              <Stars value={review.rating} />
              <p className="mt-2 text-sm text-muted">{review.body}</p>
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Messages</h2>
            <div className="card flex flex-col gap-3 p-5">
              {thread.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
              {thread.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div key={m.id} className={`max-w-[85%] ${mine ? "self-end text-right" : "self-start"}`}>
                    <p
                      className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-left text-sm ${
                        mine ? "bg-accent text-accent-foreground" : "bg-background"
                      }`}
                    >
                      {m.body}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {mine ? "You" : m.senderName} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                );
              })}
              {canMessage && (
                <ActionForm action={sendMessage.bind(null, booking.id)} resetOnSuccess className="mt-2 border-t border-border pt-4">
                  <div className="flex gap-2">
                    <input name="body" required placeholder="Write a message…" className="input" autoComplete="off" />
                    <SubmitButton pendingText="…">Send</SubmitButton>
                  </div>
                </ActionForm>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="label">Details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Date" value={formatDate(booking.eventDate)} />
              <Row label="Time" value={`${booking.startTime}, ${booking.hours} hrs`} />
              <Row label="Event" value={eventTypeLabel(booking.eventType)} />
              <Row label="Guests" value={String(booking.guests)} />
              <Row label="Location" value={booking.location} />
              <Row label="Booker" value={bookerName} />
            </dl>
          </div>
          <div className="card p-5">
            <h2 className="label">Price</h2>
            <dl className="space-y-2 text-sm">
              <Row label={`Performance, ${booking.hours} hrs`} value={formatSek(booking.performanceAmount)} />
              {booking.addonLines.map((line) => (
                <Row key={line.id} label={line.name} value={formatSek(line.amount)} />
              ))}
              <Row label="Service fee" value={formatSek(booking.serviceFee)} />
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatSek(booking.total)}</dd>
              </div>
            </dl>
            {isArtist && (
              <p className="mt-3 text-xs text-muted">
                You receive {formatSek(booking.total - booking.serviceFee)} (the booker pays the service fee).
              </p>
            )}
          </div>
          {canCancel && (
            <ActionForm action={cancelBooking.bind(null, booking.id)}>
              <SubmitButton className="btn-danger w-full" pendingText="Cancelling…">
                Cancel booking
              </SubmitButton>
            </ActionForm>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
