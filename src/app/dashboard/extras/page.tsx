import type { Metadata } from "next";
import { and, asc, eq, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { addAddon, addBlockedDate, deleteAddon, removeBlockedDate } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDate, formatSek, todayInSweden } from "@/lib/format";
import { getArtistAddons, getArtistForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Add-ons & calendar" };

export default async function ExtrasPage() {
  const user = await requireUser("/dashboard/extras");
  const artist = await getArtistForUser(user.id);
  if (!artist) redirect("/dashboard/profile");

  const today = todayInSweden();
  const [addons, blocked] = await Promise.all([
    getArtistAddons(artist.id),
    db
      .select()
      .from(schema.blockedDates)
      .where(and(eq(schema.blockedDates.artistId, artist.id), gte(schema.blockedDates.date, today)))
      .orderBy(asc(schema.blockedDates.date)),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add-ons</h2>
          <p className="mt-1 text-sm text-muted">
            Extra sound, lights, a mic or a smoke machine. Bookers tick what they want and see the price instantly.
          </p>
        </div>
        {addons.length > 0 && (
          <ul className="card divide-y divide-border">
            {addons.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted">
                    {formatSek(a.price)}
                    {a.priceType === "per_hour" ? " per hour" : " fixed price"}
                    {a.description && ` · ${a.description}`}
                  </p>
                </div>
                <form action={deleteAddon.bind(null, a.id)}>
                  <button className="text-xs text-muted hover:text-danger">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addAddon} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">New add-on</h3>
          <div>
            <label className="label" htmlFor="a-name">
              Name
            </label>
            <input id="a-name" name="name" required placeholder="E.g. Extra PA for 200+ guests" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="a-desc">
              Description
            </label>
            <input id="a-desc" name="description" placeholder="Optional" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="a-price">
                Price (SEK)
              </label>
              <input id="a-price" name="price" type="number" min={0} step={50} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="a-type">
                Pricing
              </label>
              <select id="a-type" name="priceType" className="input">
                <option value="fixed">Fixed price</option>
                <option value="per_hour">Per hour</option>
              </select>
            </div>
          </div>
          <SubmitButton>Add</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Blocked dates</h2>
          <p className="mt-1 text-sm text-muted">
            Dates you can’t play. You’re hidden from search on those dates and can’t get requests for them.
            Confirmed bookings block dates automatically.
          </p>
        </div>
        {blocked.length > 0 && (
          <ul className="card divide-y divide-border">
            {blocked.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4 text-sm">
                {formatDate(d.date)}
                <form action={removeBlockedDate.bind(null, d.id)}>
                  <button className="text-xs text-muted hover:text-danger">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addBlockedDate} resetOnSuccess className="card p-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label" htmlFor="d-date">
                Date
              </label>
              <input id="d-date" name="date" type="date" min={today} required className="input" />
            </div>
            <SubmitButton>Block</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
