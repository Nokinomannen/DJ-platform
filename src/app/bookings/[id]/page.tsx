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

export const metadata: Metadata = { title: "Bokning" };

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
        ← Tillbaka
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
              {isArtist ? `Förfrågan från ${bookerName}` : `${categoryLabel(artist.category)}`}
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
                <p className="font-semibold">Svara på förfrågan</p>
                <p className="text-sm text-muted">Bokaren får besked direkt. Bekräftade datum blockeras i din kalender.</p>
              </div>
              <div className="flex gap-2">
                <ActionForm action={respondToBooking.bind(null, booking.id, "declined")}>
                  <SubmitButton className="btn-secondary" pendingText="…">
                    Neka
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={respondToBooking.bind(null, booking.id, "accepted")}>
                  <SubmitButton pendingText="Bekräftar…">Bekräfta</SubmitButton>
                </ActionForm>
              </div>
            </div>
          )}

          {canReview && (
            <ActionForm action={submitReview.bind(null, booking.id)} className="card space-y-4 border-accent/40 p-5">
              <div>
                <p className="font-semibold">Hur var det?</p>
                <p className="text-sm text-muted">Ditt omdöme visas som verifierat på {artist.displayName}s profil.</p>
              </div>
              <fieldset className="flex flex-row-reverse justify-end gap-1 text-2xl">
                <legend className="sr-only">Betyg</legend>
                {[5, 4, 3, 2, 1].map((n) => (
                  <label
                    key={n}
                    className="cursor-pointer text-border hover:text-accent has-[:checked]:text-accent [&:has(:checked)~label]:text-accent [&:hover~label]:text-accent"
                  >
                    <input type="radio" name="rating" value={n} required className="sr-only" />
                    <span aria-label={`${n} stjärnor`}>★</span>
                  </label>
                ))}
              </fieldset>
              <textarea
                name="body"
                rows={3}
                required
                minLength={10}
                placeholder="Vad var bäst? Skulle du boka igen?"
                className="input"
              />
              <SubmitButton pendingText="Skickar…">Skicka omdöme</SubmitButton>
            </ActionForm>
          )}

          {review && (
            <div className="card p-5">
              <p className="label">Ditt omdöme · visas på {artist.displayName}s profil</p>
              <Stars value={review.rating} />
              <p className="mt-2 text-sm text-muted">{review.body}</p>
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Meddelanden</h2>
            <div className="card flex flex-col gap-3 p-5">
              {thread.length === 0 && <p className="text-sm text-muted">Inga meddelanden än.</p>}
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
                      {mine ? "Du" : m.senderName} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                );
              })}
              {canMessage && (
                <ActionForm action={sendMessage.bind(null, booking.id)} resetOnSuccess className="mt-2 border-t border-border pt-4">
                  <div className="flex gap-2">
                    <input name="body" required placeholder="Skriv ett meddelande…" className="input" autoComplete="off" />
                    <SubmitButton pendingText="…">Skicka</SubmitButton>
                  </div>
                </ActionForm>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="label">Detaljer</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Datum" value={formatDate(booking.eventDate)} />
              <Row label="Tid" value={`${booking.startTime}, ${booking.hours} tim`} />
              <Row label="Event" value={eventTypeLabel(booking.eventType)} />
              <Row label="Gäster" value={String(booking.guests)} />
              <Row label="Plats" value={booking.location} />
              <Row label="Bokare" value={bookerName} />
            </dl>
          </div>
          <div className="card p-5">
            <h2 className="label">Pris</h2>
            <dl className="space-y-2 text-sm">
              <Row label={`Spelning, ${booking.hours} tim`} value={formatSek(booking.performanceAmount)} />
              {booking.addonLines.map((line) => (
                <Row key={line.id} label={line.name} value={formatSek(line.amount)} />
              ))}
              <Row label="Serviceavgift" value={formatSek(booking.serviceFee)} />
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt>Totalt</dt>
                <dd>{formatSek(booking.total)}</dd>
              </div>
            </dl>
            {isArtist && (
              <p className="mt-3 text-xs text-muted">
                Du får {formatSek(booking.total - booking.serviceFee)} (serviceavgiften betalas av bokaren).
              </p>
            )}
          </div>
          {canCancel && (
            <ActionForm action={cancelBooking.bind(null, booking.id)}>
              <SubmitButton className="btn-danger w-full" pendingText="Avbokar…">
                Avboka
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
