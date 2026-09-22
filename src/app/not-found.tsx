import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Här var det tyst</h1>
      <p className="mt-3 text-muted">Sidan finns inte, eller så har artisten pausat sin profil.</p>
      <Link href="/search" className="btn-primary mt-8">
        Hitta artister
      </Link>
    </div>
  );
}
