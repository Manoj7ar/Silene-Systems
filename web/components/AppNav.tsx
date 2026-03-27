"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { BackToHome } from "@/components/BackToHome";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/check-in", label: "Check-in" },
  { href: "/app/medications", label: "Medications" },
  { href: "/app/appointments", label: "Appointments" },
  { href: "/app/summary", label: "Clinic summary" },
  { href: "/app/family", label: "Family" },
  { href: "/app/settings", label: "Settings" },
];

function navLinkClass(active: boolean) {
  return `shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-short)] motion-safe ${
    active
      ? "bg-primary/15 text-primary-dark shadow-[var(--shadow-card)]"
      : "text-foreground/80 hover:bg-primary/10 hover:text-primary-dark"
  }`;
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BackToHome />
            <Link href="/app" className="flex min-w-0 items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_dark.svg" alt="" className="h-8 w-auto shrink-0" />
              <span className="truncate font-serif text-lg font-semibold text-primary-dark">
                ElderCare Companion
              </span>
            </Link>
          </div>
          <SignOutButton />
        </div>
        <nav
          className="-mx-1 flex gap-2 overflow-x-auto overflow-y-hidden pb-3 pt-1 scrollbar-thin [scrollbar-width:thin] sm:mx-0"
          aria-label="App sections"
        >
          {links.map((l) => {
            const active =
              l.href === "/app"
                ? pathname === "/app"
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={navLinkClass(active)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
