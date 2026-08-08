"use client";

import { useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { useLanguage } from "@/lib/i18n/context";
import type { Journey } from "@/lib/ai/schemas";

export function JourneyEnding({ journey, onAsk }: { journey: Journey; onAsk: () => void }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: journey.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // The user dismissed the share sheet, or the clipboard was blocked.
      // Nothing to recover from, and nothing worth interrupting them about.
    }
  };

  const metrics = [
    { value: journey.summary.numberOfPhotos, label: t.journey.photos },
    { value: journey.summary.numberOfPlaces, label: t.journey.places },
    { value: journey.summary.discoveredFactsCount, label: t.journey.facts },
  ];

  return (
    <section className="py-24 sm:py-36">
      <Reveal className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2 className="font-display text-[clamp(1.9rem,5vw,3.3rem)] leading-[1.35] text-ink">
          <span className="block">{t.journey.endTitle}</span>
          <span className="block text-green-deep">{t.journey.endTitle2}</span>
        </h2>

        {journey.summary.closingText && (
          <p className="mx-auto mt-8 max-w-xl font-serif text-[1.05rem] leading-[2] text-ink-soft">
            {journey.summary.closingText}
          </p>
        )}
      </Reveal>

      {/* Typographic metrics — numbers as display type, not dashboard tiles. */}
      <Reveal delay={120} className="mx-auto mt-20 max-w-4xl px-5 sm:px-8">
        <dl className="grid grid-cols-3 gap-6 border-y border-sand/70 py-12 text-center">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="sr-only">{metric.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(2.4rem,6vw,4rem)] leading-none text-green-deep tabular">
                  {metric.value}
                </span>
                <span className="mt-3 block text-[0.78rem] uppercase tracking-[0.18em] text-ink-faint">
                  {metric.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {journey.summary.majorLandmarks.length > 0 && (
          <p className="mt-8 text-center font-serif text-[0.95rem] leading-[1.9] text-ink-faint">
            {journey.summary.majorLandmarks.join(" · ")}
          </p>
        )}
      </Reveal>

      <Reveal delay={180} className="mt-16 flex flex-wrap items-center justify-center gap-6 px-5">
        <button
          type="button"
          onClick={onAsk}
          className="rounded-full bg-green px-9 py-3.5 text-[0.95rem] text-shell transition-all hover:-translate-y-0.5 hover:bg-green-deep"
        >
          {t.journey.ask}
        </button>
        <button
          type="button"
          onClick={share}
          className="rounded-full border border-sand px-8 py-3.5 text-[0.92rem] text-ink-soft transition-colors hover:border-green hover:text-green"
        >
          {copied ? t.journey.shared : t.journey.share}
        </button>
      </Reveal>

      {journey.mode === "demo" && (
        <p className="mx-auto mt-16 max-w-lg px-5 text-center text-[0.78rem] leading-relaxed text-ink-faint/85">
          {t.journey.demoNote}
        </p>
      )}
    </section>
  );
}
