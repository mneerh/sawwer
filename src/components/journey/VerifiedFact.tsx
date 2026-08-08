"use client";

import { useLanguage } from "@/lib/i18n/context";
import type { Source } from "@/lib/ai/schemas";

/**
 * The only place in the journey where information is asserted as fact.
 * It looks deliberately different from the narrative around it — quiet, but
 * unmistakably a different kind of claim, always carrying its sources.
 */
export function VerifiedFact({
  fact,
  sources,
  tone = "light",
}: {
  fact: string;
  sources: Source[];
  tone?: "light" | "dark";
}) {
  const { t } = useLanguage();
  const dark = tone === "dark";

  return (
    <aside
      className={`rounded-lg border-s-2 py-5 pe-5 ps-6 ${
        dark ? "border-s-gold bg-shell/10 backdrop-blur-sm" : "border-s-green bg-sand-light/70"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] ${
          dark ? "text-gold" : "text-green"
        }`}
      >
        <span aria-hidden>✓</span>
        {t.journey.verified}
      </p>

      <p
        className={`mt-3 font-serif text-[0.99rem] leading-[1.95] ${dark ? "text-shell/90" : "text-ink"}`}
      >
        {fact}
      </p>

      {sources.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.74rem]">
          <span className={dark ? "text-shell/45" : "text-ink-faint"}>{t.journey.source}:</span>
          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline decoration-dotted underline-offset-4 transition-colors ${
                dark ? "text-shell/70 hover:text-shell" : "text-clay hover:text-green"
              }`}
            >
              {source.title}
            </a>
          ))}
        </p>
      )}
    </aside>
  );
}
