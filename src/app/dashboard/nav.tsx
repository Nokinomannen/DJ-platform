"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Bookings" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/sound", label: "Sound" },
  { href: "/dashboard/extras", label: "Add-ons & calendar" },
] as const;

export function DashboardNav({ profileSlug }: { profileSlug: string | null }) {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-full px-4 py-2 text-sm transition ${
            pathname === link.href ? "bg-accent font-semibold text-accent-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
      {profileSlug && (
        <Link href={`/artists/${profileSlug}`} className="ml-auto text-sm text-muted hover:text-accent">
          View my profile →
        </Link>
      )}
    </nav>
  );
}
