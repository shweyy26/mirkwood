"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/series", label: "Series" },
  { href: "/goals", label: "Goals" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold italic tracking-tight text-foreground"
        >
          📚 Reading Tracker
        </Link>
        <nav className="flex flex-wrap gap-x-1 gap-y-1 text-sm">
          {LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
