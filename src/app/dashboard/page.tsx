import type { Metadata } from "next";
import Link from "next/link";
import { BookingList } from "@/components/booking-list";
import { requireUser } from "@/lib/auth/session";
import { formatSek, todayInSweden } from "@/lib/format";
import { listBookingsForArtist, listBookingsForBooker } from "@/lib/queries";

export const metadata: Metadata = { title: "Min sida" };

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
              <p className="font-semibold">Skapa din artistprofil</p>
              <p className="text-sm text-muted">Fyll i pris, stad och genrer så syns du i sökningen direkt.</p>
            </div>
            <Link href="/dashboard/profile" className="btn-primary">
              Kom igång
            </Link>
          </div>
        )}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Mina bokningar</h2>
          <BookingList
            bookings={myBookings}
            perspective="booker"
            empty="Du har inte bokat något än. Hitta en artist och skicka en förfrågan."
          />
          <Link href="/search" className="btn-secondary mt-4">
            Hitta artister
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
        <Stat label="Nya förfrågningar" value={String(pending.length)} highlight={pending.length > 0} />
        <Stat label="Kommande spelningar" value={String(upcoming.length)} />
        <Stat label="Bokat värde framåt" value={formatSek(upcomingRevenue)} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Förfrågningar att svara på</h2>
        <BookingList bookings={pending} perspective="artist" empty="Inga obesvarade förfrågningar just nu." />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Kommande spelningar</h2>
        <BookingList bookings={upcoming} perspective="artist" empty="Inga bekräftade spelningar framåt." />
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Historik</h2>
          <BookingList bookings={past} perspective="artist" empty="" />
        </section>
      )}

      {myBookings.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Mina egna bokningar</h2>
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
