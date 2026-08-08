"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/i18n/context";

/**
 * The wordmark always leads with the Arabic imperative صوِّر — including the
 * shadda and kasra, which are what distinguish it from صور ("photos").
 */
export function Logo({ tone = "ink" }: { tone?: "ink" | "light" }) {
  const { locale } = useLanguage();
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      className="group inline-flex items-baseline gap-2.5 no-underline"
      aria-label="صوِّر — Sawwer"
    >
      <span
        className={`font-display text-[1.75rem] leading-none tracking-tight transition-colors ${
          isLight ? "text-shell" : "text-green-deep group-hover:text-green"
        }`}
        style={{ fontFeatureSettings: '"liga" 1' }}
      >
        صوِّر
      </span>
      <span
        className={`text-[0.7rem] uppercase tracking-[0.28em] transition-colors ${
          isLight ? "text-shell/70" : "text-ink-faint group-hover:text-clay"
        }`}
      >
        {locale === "ar" ? "Sawwer" : "Sawwer"}
      </span>
    </Link>
  );
}
