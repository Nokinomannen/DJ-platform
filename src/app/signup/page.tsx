import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { signup } from "@/lib/actions/auth";
import { getCurrentUser, safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const { role, next } = await props.searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  const defaultRole = role === "artist" ? "artist" : "booker";
  const nextPath = safeNextPath(next, "/search");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        {defaultRole === "artist" ? "Create your artist profile" : "Create an account"}
      </h1>
      <p className="mt-2 text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-accent underline">
          Log in
        </Link>
      </p>
      <ActionForm action={signup} className="card mt-8 space-y-4 p-6">
        <input type="hidden" name="next" value={nextPath} />
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["booker", "Book artists", "For a party, wedding or event"],
              ["artist", "Get booked", "DJ, musician, sound or party planner"],
            ].map(([value, title, hint]) => (
              <label
                key={value}
                className="cursor-pointer rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
              >
                <input type="radio" name="role" value={value} defaultChecked={value === defaultRole} className="sr-only" />
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" autoComplete="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input"
          />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
