import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex gap-6">
          <Link href="/search" className="hover:text-foreground">
            Find artists
          </Link>
          <Link href="/signup?role=artist" className="hover:text-foreground">
            For artists
          </Link>
        </div>
        <p>Book music without the DM chaos.</p>
      </div>
    </footer>
  );
}
