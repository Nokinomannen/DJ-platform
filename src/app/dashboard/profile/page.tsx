import type { Metadata } from "next";
import { ActionForm, FormMessage, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { saveProfile } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";
import { CATEGORIES, EVENT_TYPES, GENRES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";
import { getArtistForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit profile" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const artist = await getArtistForUser(user.id);

  return (
    <ActionForm action={saveProfile} customMessage className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="displayName">
                Artist name
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
                Category
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
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              maxLength={120}
              defaultValue={artist?.tagline}
              placeholder="E.g. Wedding DJ who gets both grandma and your friends dancing"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="bio">
              About you
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={3000}
              defaultValue={artist?.bio}
              placeholder="Experience, style, where you've played, what makes you unique…"
              className="input"
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Location & price</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="city">
                Home city
              </label>
              <select id="city" name="city" required defaultValue={artist?.city ?? ""} className="input">
                <option value="" disabled>
                  Pick a city
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
                Travels up to (km)
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
                Hourly rate (SEK)
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
                Minimum hours
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
              Included in the price
            </label>
            <textarea
              id="equipment"
              name="equipment"
              rows={3}
              maxLength={1500}
              defaultValue={artist?.equipment}
              placeholder="E.g. DJ booth, two speakers for up to 100 guests, wireless mic"
              className="input"
            />
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">Style</h2>
          <fieldset>
            <legend className="label">Genres</legend>
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
            <legend className="label">Happy to play</legend>
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
          <h2 className="text-lg font-semibold">Profile photo</h2>
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
          <p className="text-xs text-muted">JPG, PNG or WebP, max 5 MB.</p>
        </section>
        <section className="card space-y-4 p-6">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-semibold">Visible in search</span>
              <span className="text-muted">Turn off to pause bookings</span>
            </span>
            <input
              type="checkbox"
              name="published"
              defaultChecked={artist?.published ?? true}
              className="size-5 accent-[var(--accent)]"
            />
          </label>
          <SubmitButton className="btn-primary w-full">{artist ? "Save profile" : "Create profile"}</SubmitButton>
          <FormMessage />
        </section>
      </aside>
    </ActionForm>
  );
}
