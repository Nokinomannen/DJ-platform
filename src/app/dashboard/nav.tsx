"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Bokningar" },
  { href: "/dashboard/profile", label: "Profil" },
  { href: "/dashboard/sound", label: "Ljud" },
  { href: "/dashboard/extras", label: "Tillägg & kalender" },
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
          Visa min profil →
        </Link>
      )}
    </nav>
  );
}
