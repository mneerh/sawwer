"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { JourneyImage } from "@/components/media/JourneyImage";
import { Reveal } from "@/components/ui/Reveal";
import { DEMO_JOURNEY_ID } from "@/data/demo-journey";
import { useLanguage } from "@/lib/i18n/context";
import { deleteJourney, listJourneys } from "@/lib/storage/journeys";
import type { Journey } from "@/lib/ai/schemas";

/** A personal travel library, not a table of records. */
export function JourneyLibrary() {
  const { t, locale } = useLanguage();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);

  useEffect(() => {
    listJourneys().then(setJourneys);
  }, []);

  const remove = async (id: string) => {
    await deleteJourney(id);
    setJourneys(await listJourneys());
  };

  if (journeys === null) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="font-serif text-ink-faint">{t.common.loading}</p>
      </div>
    );
  }

  // The sample journey is always present, so "empty" means nothing of the
  // traveller's own.
  const isEmpty = journeys.every((journey) => journey.id === DEMO_JOURNEY_ID);

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <p className="text-[0.72rem] uppercase tracking-[0.3em] text-clay">{t.journeys.kicker}</p>
      <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.2rem)] text-ink">{t.journeys.title}</h1>
      <p className="mt-4 font-serif text-[1rem] text-ink-soft">{t.journeys.subtitle}</p>

      {isEmpty && (
        <div className="mt-14 rounded-xl border border-dashed border-sand px-8 py-14 text-center">
          <h2 className="font-display text-[1.5rem] text-ink">{t.journeys.emptyTitle}</h2>
          <p className="mt-3 font-serif text-[0.98rem] text-ink-soft">{t.journeys.emptyBody}</p>
          <Link
            href="/create"
            className="mt-8 inline-block rounded-full bg-green px-8 py-3 text-[0.92rem] text-shell transition-colors hover:bg-green-deep"
          >
            {t.journeys.emptyCta}
          </Link>
        </div>
      )}

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        {journeys.map((journey, index) => (
          <Reveal key={journey.id} delay={index * 80}>
            <article className="group relative">
              <Link href={`/journey/${journey.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-sand/60">
                  <JourneyImage
                    imageId={journey.coverImageId}
                    alt={journey.title}
                    className="h-full w-full transition-transform duration-[900ms] group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {journey.mode === "demo" && (
                    <span className="absolute top-4 start-4 rounded-full bg-shell/90 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-clay">
                      {t.journeys.demo}
                    </span>
                  )}
                </div>

                <h2 className="mt-6 font-display text-[1.7rem] leading-tight text-ink transition-colors group-hover:text-green-deep">
                  {journey.title}
                </h2>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[0.85rem] text-ink-faint">
                  <span>{journey.destination}</span>
                  <span aria-hidden>·</span>
                  <span>{t.journeys.stops(journey.stops.length)}</span>
                  {journey.date && (
                    <>
                      <span aria-hidden>·</span>
                      <time dateTime={journey.date}>
                        {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(journey.date))}
                      </time>
                    </>
                  )}
                </p>
              </Link>

              {journey.id !== DEMO_JOURNEY_ID && (
                <button
                  type="button"
                  onClick={() => remove(journey.id)}
                  aria-label={`${t.journeys.delete}: ${journey.title}`}
                  className="absolute top-4 end-4 rounded-full bg-shell/90 px-3 py-1.5 text-[0.75rem] text-ink-faint opacity-0 transition-all hover:text-terracotta focus-visible:opacity-100 group-hover:opacity-100"
                >
                  {t.journeys.delete}
                </button>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
