import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/series", label: "Series" },
  { href: "/goals", label: "Goals" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          📚 Reading Tracker
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
