import { requireUser } from "@/lib/auth/session";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const isArtist = user.role === "artist" || Boolean(user.artist);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted">Hi {user.name.split(" ")[0]}!</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{isArtist ? "Dashboard" : "My bookings"}</h1>
      {isArtist && <DashboardNav profileSlug={user.artist?.slug ?? null} />}
      <div className="mt-8">{children}</div>
    </div>
  );
}
