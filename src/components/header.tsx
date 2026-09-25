import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { Logo } from "./logo";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Gigga home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/search" className="btn-ghost px-3">
            Find artists
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost px-3">
                {user.artist ? "Dashboard" : "My bookings"}
              </Link>
              <form action={logout}>
                <button className="btn-secondary px-4 py-2">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signup?role=artist" className="btn-ghost hidden px-3 sm:inline-flex">
                Become an artist
              </Link>
              <Link href="/login" className="btn-secondary px-4 py-2">
                Log in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
