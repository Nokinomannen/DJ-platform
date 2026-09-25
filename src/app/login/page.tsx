import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "@/lib/actions/auth";
import { getCurrentUser, safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  const nextPath = safeNextPath(next);
  if (await getCurrentUser()) redirect(nextPath);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
      <p className="mt-2 text-muted">
        No account?{" "}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="text-accent underline">
          Create one
        </Link>
      </p>
      <ActionForm action={login} className="card mt-8 space-y-4 p-6">
        <input type="hidden" name="next" value={nextPath} />
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
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-xs text-muted">
        Try <span className="font-mono">demo@gigga.se</span> (booker) or{" "}
        <span className="font-mono">nova@demo.gigga.se</span> (DJ), password <span className="font-mono">gigga1234</span>.
      </p>
    </div>
  );
}
