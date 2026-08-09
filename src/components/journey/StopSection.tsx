"use client";

import { JourneyImage } from "@/components/media/JourneyImage";
import { VerifiedFact } from "@/components/journey/VerifiedFact";
import { Reveal } from "@/components/ui/Reveal";
import { UNCERTAIN_THRESHOLD, type JourneyStop } from "@/lib/ai/schemas";
import { formatDayDate, formatTime } from "@/lib/datetime";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Each stop is its own composition. The layout rotates across four shapes so
 * scrolling reads like a photo essay rather than a list of cards — the
 * variation is the point, not decoration.
 */
export function StopSection({ stop }: { stop: JourneyStop }) {
  const variant = (stop.order - 1) % 4;

  const content = { 0: <FullBleed stop={stop} />, 1: <Split stop={stop} />, 2: <Immersive stop={stop} />, 3: <Detail stop={stop} /> }[
    variant
  ];

  return (
    <section id={`stop-${stop.order}`} data-stop-id={stop.id} className="scroll-mt-20">
      {content}
    </section>
  );
}

/* ------------------------------ shared bits ----------------------------- */

function StopLabel({ stop, tone = "light" }: { stop: JourneyStop; tone?: "light" | "dark" }) {
  const { t, locale } = useLanguage();
  const dark = tone === "dark";
  const uncertain = stop.confidence < UNCERTAIN_THRESHOLD;
  const time = formatTime(stop.capturedAt, locale);

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      {/* The capture time leads, with the ordinal beneath it — the sequence the
          reader sees is the sequence the camera recorded. */}
      <span className="shrink-0">
        <span
          className={`block font-display leading-none tabular ${
            time
              ? `text-[1.7rem] ${dark ? "text-gold" : "text-green-deep"}`
              : `text-[0.78rem] ${dark ? "text-shell/45" : "text-ink-faint/80"}`
          }`}
        >
          {time ?? t.journey.noTime}
        </span>
        <span className={`mt-1.5 block text-[0.7rem] tracking-[0.2em] tabular ${dark ? "text-shell/30" : "text-sand"}`}>
          {String(stop.order).padStart(2, "0")}
        </span>
      </span>

      <div>
        <h2 className={`font-display text-[clamp(1.6rem,3.6vw,2.5rem)] leading-tight ${dark ? "text-shell" : "text-ink"}`}>
          {stop.placeName || t.journey.unnamedPlace}
        </h2>
        <p className={`mt-1.5 text-[0.8rem] tracking-wide ${dark ? "text-shell/55" : "text-ink-faint"}`}>
          {stop.location}
          {uncertain && (
            <span className={`ms-3 rounded-full px-2 py-0.5 text-[0.7rem] ${dark ? "bg-shell/15 text-gold" : "bg-gold/18 text-clay"}`}>
              {t.journey.uncertainStop}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Divider between trip days. Only rendered when a journey spans more than one. */
export function DayDivider({ dayNumber, date }: { dayNumber: number; date: string | null }) {
  const { t, locale } = useLanguage();
  const label = formatDayDate(date, locale);

  return (
    <div className="border-y border-sand/60 bg-sand-light/60 py-10">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.3em] text-clay">{t.journey.dayLabel(dayNumber)}</p>
        {label && <p className="mt-3 font-display text-[clamp(1.5rem,3.4vw,2.2rem)] text-ink">{label}</p>}
      </Reveal>
    </div>
  );
}

function Narrative({ stop, tone = "light", size = "base" }: { stop: JourneyStop; tone?: "light" | "dark"; size?: "base" | "large" }) {
  const dark = tone === "dark";
  return (
    <>
      <h3 className={`font-display text-[1.25rem] ${dark ? "text-gold" : "text-green-deep"}`}>{stop.title}</h3>
      <p
        className={`mt-4 font-serif leading-[2.05] ${
          size === "large" ? "text-[clamp(1.1rem,2.2vw,1.45rem)] leading-[1.85]" : "text-[1.02rem]"
        } ${dark ? "text-shell/85" : "text-ink-soft"}`}
      >
        {stop.narrative}
      </p>
    </>
  );
}

function MapsLink({ stop, tone = "light" }: { stop: JourneyStop; tone?: "light" | "dark" }) {
  const { t } = useLanguage();
  const url = stop.googleMapsUrl ?? (stop.coordinates ? `https://www.google.com/maps/search/?api=1&query=${stop.coordinates.lat},${stop.coordinates.lng}` : null);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-[0.82rem] underline decoration-dotted underline-offset-4 transition-colors ${
        tone === "dark" ? "text-shell/65 hover:text-shell" : "text-clay hover:text-green"
      }`}
    >
      <span aria-hidden>◎</span>
      {t.journey.openInMaps}
    </a>
  );
}

function ExtraPhotos({ stop }: { stop: JourneyStop }) {
  if (stop.imageIds.length < 2) return null;

  return (
    <div className="mt-6 grid grid-cols-3 gap-2.5">
      {stop.imageIds.slice(1, 4).map((imageId) => (
        <div key={imageId} className="aspect-[4/3] overflow-hidden rounded-md border border-sand/60">
          <JourneyImage imageId={imageId} alt={stop.placeName} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- variants ------------------------------ */

function FullBleed({ stop }: { stop: JourneyStop }) {
  return (
    <div className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-sand/50 sm:aspect-[16/8]">
          <JourneyImage imageId={stop.imageIds[0] ?? null} alt={stop.placeName} className="h-full w-full" />
        </div>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <StopLabel stop={stop} />
          <div className="mt-6">
            <MapsLink stop={stop} />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Narrative stop={stop} />
          {stop.verifiedFact && (
            <div className="mt-9">
              <VerifiedFact fact={stop.verifiedFact} sources={stop.sources} />
            </div>
          )}
          <ExtraPhotos stop={stop} />
        </Reveal>
      </div>
    </div>
  );
}

function Split({ stop }: { stop: JourneyStop }) {
  return (
    <div className="bg-sand-light/45 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-1">
          <div className="aspect-[4/5] overflow-hidden rounded-xl border border-sand/60 shadow-[0_30px_60px_-45px_rgba(46,41,37,0.6)]">
            <JourneyImage imageId={stop.imageIds[0] ?? null} alt={stop.placeName} className="h-full w-full" />
          </div>
        </Reveal>

        <Reveal className="order-2" delay={120}>
          <StopLabel stop={stop} />
          <div className="mt-8">
            <Narrative stop={stop} />
          </div>
          {stop.verifiedFact && (
            <div className="mt-9">
              <VerifiedFact fact={stop.verifiedFact} sources={stop.sources} />
            </div>
          )}
          <div className="mt-7">
            <MapsLink stop={stop} />
          </div>
          <ExtraPhotos stop={stop} />
        </Reveal>
      </div>
    </div>
  );
}

function Immersive({ stop }: { stop: JourneyStop }) {
  const { t } = useLanguage();

  return (
    <div className="relative isolate overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 -z-10">
        <JourneyImage imageId={stop.imageIds[0] ?? null} alt={stop.placeName} className="h-full w-full animate-drift" />
        <div className="absolute inset-0 bg-ink/72" aria-hidden />
      </div>

      <Reveal className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <div className="flex justify-center">
          <StopLabel stop={stop} tone="dark" />
        </div>

        <blockquote className="mt-12">
          <Narrative stop={stop} tone="dark" size="large" />
        </blockquote>

        {stop.verifiedFact && (
          <div className="mt-12 text-start">
            <p className="mb-4 text-center text-[0.74rem] uppercase tracking-[0.24em] text-shell/45">
              {t.journey.fromMemory}
            </p>
            <VerifiedFact fact={stop.verifiedFact} sources={stop.sources} tone="dark" />
          </div>
        )}

        <div className="mt-10">
          <MapsLink stop={stop} tone="dark" />
        </div>
      </Reveal>
    </div>
  );
}

function Detail({ stop }: { stop: JourneyStop }) {
  const { t } = useLanguage();

  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <Reveal>
          <div className="aspect-[3/2] overflow-hidden rounded-xl border border-sand/50">
            <JourneyImage imageId={stop.imageIds[0] ?? null} alt={stop.placeName} className="h-full w-full" />
          </div>
          <ExtraPhotos stop={stop} />
        </Reveal>

        <Reveal delay={110} className="flex flex-col justify-center">
          <StopLabel stop={stop} />

          <div className="mt-8">
            <Narrative stop={stop} />
          </div>

          {/* Only worth a card when there is something in it — an unidentified
              stop with no coordinates would otherwise render an empty box. */}
          {(stop.placeName || stop.location || stop.coordinates) && (
            <div className="mt-9 rounded-lg border border-sand/70 p-6">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-clay">{t.journey.stopLabel}</p>
              <p className={`mt-3 font-display text-[1.2rem] ${stop.placeName ? "text-ink" : "text-ink-faint"}`}>
                {stop.placeName || t.journey.unnamedPlace}
              </p>
              {stop.location && <p className="mt-1 text-[0.84rem] text-ink-faint">{stop.location}</p>}
              {stop.coordinates && (
                <p className="mt-3 text-[0.76rem] text-ink-faint/80 tabular" dir="ltr">
                  {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                </p>
              )}
              <div className="mt-4">
                <MapsLink stop={stop} />
              </div>
            </div>
          )}

          {stop.verifiedFact && (
            <div className="mt-8">
              <VerifiedFact fact={stop.verifiedFact} sources={stop.sources} />
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
