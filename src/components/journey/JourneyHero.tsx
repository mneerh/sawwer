"use client";

import { useEffect, useState } from "react";

import { JourneyImage } from "@/components/media/JourneyImage";
import { useLanguage } from "@/lib/i18n/context";
import type { Journey } from "@/lib/ai/schemas";

export function JourneyHero({ journey }: { journey: Journey }) {
  const { t, locale } = useLanguage();
  const [offset, setOffset] = useState(0);

  // Light parallax: the cover drifts at a third of scroll speed, and only
  // while the hero is still on screen.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setOffset(y < window.innerHeight ? y * 0.32 : window.innerHeight * 0.32);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const date = journey.date
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(journey.date))
    : null;

  return (
    <header className="relative h-[92vh] min-h-[34rem] overflow-hidden">
      <div className="absolute inset-0 scale-110" style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.12)` }}>
        <JourneyImage
          imageId={journey.coverImageId}
          alt={journey.title}
          className="h-full w-full"
          priority
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/35" aria-hidden />
      {/* A second scrim under the header — covers are often bright at the top,
          and the transparent nav has to stay legible over any photo. */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/55 to-transparent" aria-hidden />

      <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-5 pb-20 sm:px-8 sm:pb-24">
        {journey.mode === "demo" && (
          <span className="mb-6 w-fit rounded-full border border-shell/35 px-3.5 py-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-shell/80">
            {t.journey.demoBadge}
          </span>
        )}

        <p className="text-[0.74rem] uppercase tracking-[0.3em] text-shell/70">
          {journey.destination}
          {date && <span className="mx-2.5 text-shell/40">·</span>}
          {date}
        </p>

        <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.2rem)] leading-[1.08] text-shell animate-fade-in">
          {journey.title}
        </h1>

        <p className="mt-6 max-w-xl font-serif text-[1.06rem] leading-[1.95] text-shell/80">
          {journey.shortIntro}
        </p>

        <a
          href="#stop-1"
          className="group mt-12 inline-flex w-fit items-center gap-3 text-[0.86rem] tracking-wide text-shell/75 transition-colors hover:text-shell"
        >
          {t.journey.start}
          <span className="inline-block transition-transform duration-500 group-hover:translate-y-1" aria-hidden>
            ↓
          </span>
        </a>
      </div>
    </header>
  );
}
