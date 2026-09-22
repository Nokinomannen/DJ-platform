import type { Metadata } from "next";
import { and, asc, eq, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { addAddon, addBlockedDate, deleteAddon, removeBlockedDate } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDate, formatSek, todayInSweden } from "@/lib/format";
import { getArtistAddons, getArtistForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Tillägg & kalender" };

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
          <h2 className="text-lg font-semibold">Tillägg</h2>
          <p className="mt-1 text-sm text-muted">
            Extra ljud, ljus, mikrofon eller rökmaskin. Bokaren kryssar i det de vill ha och ser priset direkt.
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
                    {a.priceType === "per_hour" ? " per timme" : " fast pris"}
                    {a.description && ` · ${a.description}`}
                  </p>
                </div>
                <form action={deleteAddon.bind(null, a.id)}>
                  <button className="text-xs text-muted hover:text-danger">Ta bort</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addAddon} resetOnSuccess className="card space-y-4 p-6">
          <h3 className="font-semibold">Nytt tillägg</h3>
          <div>
            <label className="label" htmlFor="a-name">
              Namn
            </label>
            <input id="a-name" name="name" required placeholder="T.ex. Extra PA för 200+ gäster" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="a-desc">
              Beskrivning
            </label>
            <input id="a-desc" name="description" placeholder="Valfritt" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="a-price">
                Pris (kr)
              </label>
              <input id="a-price" name="price" type="number" min={0} step={50} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="a-type">
                Prissättning
              </label>
              <select id="a-type" name="priceType" className="input">
                <option value="fixed">Fast pris</option>
                <option value="per_hour">Per timme</option>
              </select>
            </div>
          </div>
          <SubmitButton>Lägg till</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Blockerade datum</h2>
          <p className="mt-1 text-sm text-muted">
            Datum du inte kan spela. Du döljs i sökningar för de datumen och kan inte få förfrågningar på dem.
            Bekräftade bokningar blockerar automatiskt.
          </p>
        </div>
        {blocked.length > 0 && (
          <ul className="card divide-y divide-border">
            {blocked.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4 text-sm">
                {formatDate(d.date)}
                <form action={removeBlockedDate.bind(null, d.id)}>
                  <button className="text-xs text-muted hover:text-danger">Ta bort</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addBlockedDate} resetOnSuccess className="card p-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label" htmlFor="d-date">
                Datum
              </label>
              <input id="d-date" name="date" type="date" min={today} required className="input" />
            </div>
            <SubmitButton>Blockera</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
