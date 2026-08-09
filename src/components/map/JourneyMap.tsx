"use client";

import dynamic from "next/dynamic";

import { Reveal } from "@/components/ui/Reveal";
import { directionsUrl } from "@/lib/google/maps";
import { isUsableCoordinate } from "@/lib/geo";
import { useLanguage } from "@/lib/i18n/context";
import type { Journey } from "@/lib/ai/schemas";

/**
 * Leaflet reaches for `window` as soon as it is imported, so the map is loaded
 * only in the browser. The placeholder holds the same height to keep the
 * storytelling scroll from jumping when it arrives.
 */
const LeafletJourneyMap = dynamic(() => import("@/components/map/LeafletJourneyMap"), {
  ssr: false,
  loading: () => <div className="h-[26rem] w-full animate-pulse rounded-xl bg-sand-light sm:h-[32rem]" aria-hidden />,
});

export function JourneyMap({ journey, onSelectStop }: { journey: Journey; onSelectStop?: (stopId: string) => void }) {
  const { t } = useLanguage();

  // Coordinates come from the journey itself — EXIF GPS, Google Places when
  // configured, or the gazetteer. Nothing is looked up here.
  const plottable = journey.stops.filter((stop) => isUsableCoordinate(stop.coordinates));
  if (plottable.length === 0) return null;

  const routeUrl = directionsUrl(
    plottable.map((stop) => ({ stopId: stop.id, label: stop.placeName, coordinates: stop.coordinates! })),
  );

  return (
    <section className="border-y border-sand/60 bg-sand-light/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] text-ink">{t.journey.mapTitle}</h2>
          <p className="mt-3 font-serif text-[0.98rem] text-ink-soft">{t.journey.mapSubtitle}</p>
        </Reveal>

        <Reveal delay={100} className="mt-10 overflow-hidden rounded-xl border border-sand/70 bg-shell p-1.5">
          <LeafletJourneyMap journey={journey} onSelectStop={onSelectStop} />
        </Reveal>

        {routeUrl && (
          <div className="mt-6 flex justify-end">
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.85rem] text-clay underline decoration-dotted underline-offset-4 transition-colors hover:text-green"
            >
              {t.journey.openRoute}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
