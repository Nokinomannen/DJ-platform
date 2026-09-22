import type { Metadata } from "next";
import { ActionForm, FormMessage, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { saveProfile } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";
import { CATEGORIES, EVENT_TYPES, GENRES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";
import { getArtistForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Redigera profil" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const artist = await getArtistForUser(user.id);

  return (
    <ActionForm action={saveProfile} customMessage className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Grundinfo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="displayName">
                Artistnamn
              </label>
              <input
                id="displayName"
                name="displayName"
                required
                defaultValue={artist?.displayName ?? user.name}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="category">
                Kategori
              </label>
              <select id="category" name="category" defaultValue={artist?.category ?? "dj"} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tagline">
              Kort beskrivning
            </label>
            <input
              id="tagline"
              name="tagline"
              maxLength={120}
              defaultValue={artist?.tagline}
              placeholder="T.ex. Bröllops-DJ som får både mormor och kompisarna att dansa"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="bio">
              Om dig
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={3000}
              defaultValue={artist?.bio}
              placeholder="Erfarenhet, stil, var du har spelat, vad som gör dig unik…"
              className="input"
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Plats & pris</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="city">
                Hemstad
              </label>
              <select id="city" name="city" required defaultValue={artist?.city ?? ""} className="input">
                <option value="" disabled>
                  Välj stad
                </option>
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="travelRadiusKm">
                Reser upp till (km)
              </label>
              <input
                id="travelRadiusKm"
                name="travelRadiusKm"
                type="number"
                min={0}
                max={2000}
                defaultValue={artist?.travelRadiusKm ?? 50}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="hourlyRate">
                Timpris (kr)
              </label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min={100}
                step={50}
                required
                defaultValue={artist?.hourlyRate ?? 1200}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="minHours">
                Minsta antal timmar
              </label>
              <input
                id="minHours"
                name="minHours"
                type="number"
                min={1}
                max={12}
                defaultValue={artist?.minHours ?? 3}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="equipment">
              Ingår i priset
            </label>
            <textarea
              id="equipment"
              name="equipment"
              rows={3}
              maxLength={1500}
              defaultValue={artist?.equipment}
              placeholder="T.ex. DJ-bord, två högtalare för upp till 100 gäster, trådlös mikrofon"
              className="input"
            />
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">Stil</h2>
          <fieldset>
            <legend className="label">Genrer</legend>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <label key={g} className="chip cursor-pointer py-1.5 has-[:checked]:border-accent has-[:checked]:text-accent">
                  <input
                    type="checkbox"
                    name="genres"
                    value={g}
                    defaultChecked={artist?.genres.includes(g)}
                    className="sr-only"
                  />
                  {g}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Spelar gärna på</legend>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((e) => (
                <label key={e.id} className="chip cursor-pointer py-1.5 has-[:checked]:border-accent has-[:checked]:text-accent">
                  <input
                    type="checkbox"
                    name="eventTypes"
                    value={e.id}
                    defaultChecked={artist?.eventTypes.includes(e.id)}
                    className="sr-only"
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Profilbild</h2>
          <Avatar
            name={artist?.displayName ?? user.name}
            hue={artist?.avatarHue ?? 280}
            imageKey={artist?.imageKey ?? null}
            className="aspect-square w-full rounded-2xl"
            textClassName="text-6xl"
          />
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-card-hover file:px-4 file:py-2 file:text-foreground"
          />
          <p className="text-xs text-muted">JPG, PNG eller WebP, max 5 MB.</p>
        </section>
        <section className="card space-y-4 p-6">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-semibold">Synlig i sökningar</span>
              <span className="text-muted">Stäng av om du vill pausa bokningar</span>
            </span>
            <input
              type="checkbox"
              name="published"
              defaultChecked={artist?.published ?? true}
              className="size-5 accent-[var(--accent)]"
            />
          </label>
          <SubmitButton className="btn-primary w-full">{artist ? "Spara profil" : "Skapa profil"}</SubmitButton>
          <FormMessage />
        </section>
      </aside>
    </ActionForm>
  );
}
