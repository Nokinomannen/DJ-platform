"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requestBooking } from "@/lib/actions/booking";
import { EVENT_TYPES } from "@/lib/constants";
import { formatSek } from "@/lib/format";
import { MAX_BOOKING_HOURS, quote, SERVICE_FEE_RATE, type PricedAddon } from "@/lib/pricing";

type Props = {
  artist: { id: string; hourlyRate: number; minHours: number };
  addons: PricedAddon[];
  unavailableDates: string[];
  today: string;
  isLoggedIn: boolean;
  isOwner: boolean;
  loginHref: string;
};

export function BookingCard({ artist, addons, unavailableDates, today, isLoggedIn, isOwner, loginHref }: Props) {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState(Math.max(artist.minHours, 4));
  const [selected, setSelected] = useState<string[]>([]);

  const q = useMemo(
    () => quote(artist, hours, addons.filter((a) => selected.includes(a.id))),
    [artist, hours, addons, selected],
  );
  const unavailable = date !== "" && unavailableDates.includes(date);

  return (
    <div className="card p-5 shadow-2xl shadow-black/40">
      <p className="text-2xl font-bold">
        {formatSek(artist.hourlyRate)}
        <span className="text-base font-normal text-muted"> / hour</span>
      </p>
      <p className="text-xs text-muted">Minimum {artist.minHours} hours</p>

      <ActionForm action={requestBooking} className="mt-5 space-y-3">
        <input type="hidden" name="artistId" value={artist.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="b-date">
              Date
            </label>
            <input
              id="b-date"
              type="date"
              name="eventDate"
              min={today}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="b-start">
              Start
            </label>
            <input id="b-start" type="time" name="startTime" defaultValue="20:00" required className="input" />
          </div>
        </div>
        {unavailable && <p className="text-sm text-danger">Busy on that date. Pick another one.</p>}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="b-hours">
              Hours
            </label>
            <select
              id="b-hours"
              name="hours"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: MAX_BOOKING_HOURS - artist.minHours + 1 }, (_, i) => artist.minHours + i).map(
                (h) => (
                  <option key={h} value={h}>
                    {h} hrs
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="b-guests">
              Guests
            </label>
            <input id="b-guests" type="number" name="guests" min={1} defaultValue={60} required className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="b-type">
            Event type
          </label>
          <select id="b-type" name="eventType" required defaultValue="" className="input">
            <option value="" disabled>
              Choose…
            </option>
            {EVENT_TYPES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="b-location">
            Location
          </label>
          <input
            id="b-location"
            name="location"
            required
            placeholder="Venue or address"
            className="input"
          />
        </div>

        {addons.length > 0 && (
          <fieldset>
            <legend className="label">Add-ons</legend>
            <div className="space-y-2">
              {addons.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      name="addonIds"
                      value={a.id}
                      checked={selected.includes(a.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((id) => id !== a.id)))
                      }
                      className="accent-[var(--accent)]"
                    />
                    {a.name}
                  </span>
                  <span className="text-muted">
                    +{formatSek(a.price)}
                    {a.priceType === "per_hour" && "/hr"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <label className="label" htmlFor="b-message">
            Message
          </label>
          <textarea
            id="b-message"
            name="message"
            rows={3}
            placeholder="Tell them about the party, song requests, timings…"
            className="input resize-none"
          />
        </div>

        <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">
              {formatSek(artist.hourlyRate)} × {q.billableHours} hrs
            </dt>
            <dd>{formatSek(q.performance)}</dd>
          </div>
          {q.addonLines.map((line) => (
            <div key={line.id} className="flex justify-between">
              <dt className="text-muted">{line.name}</dt>
              <dd>{formatSek(line.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between">
            <dt className="text-muted">Service fee ({Math.round(SERVICE_FEE_RATE * 100)} %)</dt>
            <dd>{formatSek(q.serviceFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatSek(q.total)}</dd>
          </div>
        </dl>

        {isOwner ? (
          <p className="rounded-xl bg-background p-3 text-center text-sm text-muted">This is your own profile.</p>
        ) : isLoggedIn ? (
          <SubmitButton className="btn-primary w-full py-3" pendingText="Sending…" disabled={unavailable}>
            Send booking request
          </SubmitButton>
        ) : (
          <Link href={loginHref} className="btn-primary w-full py-3">
            Log in to book
          </Link>
        )}
        <p className="text-center text-xs text-muted">Sending a request is free.</p>
      </ActionForm>
    </div>
  );
}
