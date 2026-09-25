import Link from "next/link";
import { BOOKING_STATUS_LABELS, eventTypeLabel } from "@/lib/constants";
import { formatDate, formatSek } from "@/lib/format";
import type { BookingListItem } from "@/lib/queries";

const STATUS_STYLES: Record<BookingListItem["status"], string> = {
  pending: "border-amber-400/40 text-amber-300",
  accepted: "border-accent/50 text-accent",
  declined: "border-border text-muted",
  cancelled: "border-border text-muted",
};

export function StatusBadge({ status }: { status: BookingListItem["status"] }) {
  return <span className={`chip ${STATUS_STYLES[status]}`}>{BOOKING_STATUS_LABELS[status]}</span>;
}

export function BookingList({
  bookings,
  perspective,
  empty,
}: {
  bookings: BookingListItem[];
  perspective: "artist" | "booker";
  empty: string;
}) {
  if (bookings.length === 0) return <p className="card p-6 text-sm text-muted">{empty}</p>;
  return (
    <ul className="card divide-y divide-border">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link
            href={`/bookings/${b.id}`}
            className="flex flex-col gap-2 p-4 transition hover:bg-card-hover sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {perspective === "artist" ? b.bookerName : b.artistName}
                <span className="text-muted"> · {eventTypeLabel(b.eventType)}</span>
              </p>
              <p className="text-sm text-muted">
                {formatDate(b.eventDate)} at {b.startTime} · {b.hours} hrs · {b.location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{formatSek(b.total)}</span>
              <StatusBadge status={b.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
