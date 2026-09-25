import type { Metadata } from "next";
import Link from "next/link";
import { BookingList } from "@/components/booking-list";
import { requireUser } from "@/lib/auth/session";
import { formatSek, todayInSweden } from "@/lib/format";
import { listBookingsForArtist, listBookingsForBooker } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const today = todayInSweden();
  const myBookings = await listBookingsForBooker(user.id);

  if (!user.artist) {
    return (
      <div className="space-y-10">
        {user.role === "artist" && (
          <div className="card flex flex-col gap-4 border-accent/40 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Create your artist profile</p>
              <p className="text-sm text-muted">Add your price, city and genres and you’ll show up in search right away.</p>
            </div>
            <Link href="/dashboard/profile" className="btn-primary">
              Get started
            </Link>
          </div>
        )}
        <section>
          <h2 className="mb-4 text-lg font-semibold">My bookings</h2>
          <BookingList
            bookings={myBookings}
            perspective="booker"
            empty="You haven't booked anything yet. Find an artist and send a request."
          />
          <Link href="/search" className="btn-secondary mt-4">
            Find artists
          </Link>
        </section>
      </div>
    );
  }

  const incoming = await listBookingsForArtist(user.artist.id);
  const pending = incoming.filter((b) => b.status === "pending" && b.eventDate >= today);
  const upcoming = incoming.filter((b) => b.status === "accepted" && b.eventDate >= today);
  const past = incoming
    .filter((b) => !(b.eventDate >= today && (b.status === "pending" || b.status === "accepted")))
    .reverse();
  const upcomingRevenue = upcoming.reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="New requests" value={String(pending.length)} highlight={pending.length > 0} />
        <Stat label="Upcoming gigs" value={String(upcoming.length)} />
        <Stat label="Upcoming booked value" value={formatSek(upcomingRevenue)} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Requests to answer</h2>
        <BookingList bookings={pending} perspective="artist" empty="No unanswered requests right now." />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Upcoming gigs</h2>
        <BookingList bookings={upcoming} perspective="artist" empty="No confirmed upcoming gigs." />
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">History</h2>
          <BookingList bookings={past} perspective="artist" empty="" />
        </section>
      )}

      {myBookings.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">My own bookings</h2>
          <BookingList bookings={myBookings} perspective="booker" empty="" />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "border-accent/50" : ""}`}>
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
