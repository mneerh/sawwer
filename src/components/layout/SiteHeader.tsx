"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { useLanguage } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t, locale, setLocale } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // The journey page owns its own cinematic header treatment.
  const overCover = pathname?.startsWith("/journey/") ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !overCover;

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/#how", label: t.nav.how },
    { href: "/journeys", label: t.nav.journeys },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "border-b border-sand/40 bg-shell/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Logo tone={solid ? "ink" : "light"} />

        <nav className="hidden items-center gap-8 md:flex" aria-label={t.nav.home}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.9rem] transition-colors ${
                solid ? "text-ink-soft hover:text-green" : "text-shell/85 hover:text-shell"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex items-center rounded-full border p-0.5 text-[0.7rem] ${
              solid ? "border-sand/70" : "border-shell/30"
            }`}
            role="group"
            aria-label="Language"
          >
            {(["ar", "en"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option)}
                aria-pressed={locale === option}
                className={`rounded-full px-2.5 py-1 uppercase tracking-wider transition-colors ${
                  locale === option
                    ? "bg-green text-shell"
                    : solid
                      ? "text-ink-faint hover:text-ink"
                      : "text-shell/70 hover:text-shell"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <Link
            href="/create"
            className={`hidden rounded-full px-5 py-2.5 text-[0.85rem] transition-all sm:inline-block ${
              solid
                ? "bg-green text-shell hover:bg-green-deep"
                : "border border-shell/50 text-shell hover:bg-shell hover:text-green-deep"
            }`}
          >
            {t.nav.start}
          </Link>
        </div>
      </div>
    </header>
  );
}
