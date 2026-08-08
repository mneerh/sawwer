"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AskPanel } from "@/components/journey/AskPanel";
import { JourneyEnding } from "@/components/journey/JourneyEnding";
import { JourneyHero } from "@/components/journey/JourneyHero";
import { StopSection } from "@/components/journey/StopSection";
import { JourneyMap } from "@/components/map/JourneyMap";
import { useLanguage } from "@/lib/i18n/context";
import { getJourney } from "@/lib/storage/journeys";
import type { Journey } from "@/lib/ai/schemas";

export function JourneyExperience({ journeyId }: { journeyId: string }) {
  const { t } = useLanguage();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getJourney(journeyId).then((found) => {
      if (!active) return;
      setJourney(found);
      setStatus(found ? "ready" : "missing");
    });
    return () => {
      active = false;
    };
  }, [journeyId]);

  const focusStop = useCallback(
    (stopId: string) => {
      const stop = journey?.stops.find((candidate) => candidate.id === stopId);
      if (!stop) return;
      document.getElementById(`stop-${stop.order}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [journey],
  );

  if (status === "loading") {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <p className="font-serif text-ink-faint">{t.common.loading}</p>
      </div>
    );
  }

  if (status === "missing" || !journey) {
    return (
      <section className="mx-auto max-w-xl px-5 py-40 text-center sm:px-8">
        <h1 className="font-display text-[2.2rem] text-ink">{t.journey.notFoundTitle}</h1>
        <p className="mt-4 font-serif leading-[1.9] text-ink-soft">{t.journey.notFoundBody}</p>
        <div className="mt-10 flex justify-center gap-5">
          <Link href="/create" className="rounded-full bg-green px-8 py-3 text-[0.92rem] text-shell hover:bg-green-deep">
            {t.nav.start}
          </Link>
          <Link href="/journeys" className="self-center text-[0.9rem] text-ink-faint hover:text-ink">
            {t.nav.journeys}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <article>
        <JourneyHero journey={journey} />

        {journey.stops.map((stop) => (
          <StopSection key={stop.id} stop={stop} />
        ))}

        <JourneyMap journey={journey} onSelectStop={focusStop} />

        <JourneyEnding journey={journey} onAsk={() => setAskOpen(true)} />
      </article>

      <AskPanel journey={journey} open={askOpen} onOpenChange={setAskOpen} onFocusStop={focusStop} />
    </>
  );
}
