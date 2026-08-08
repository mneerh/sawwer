"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n/context";
import type { PreparedImage } from "@/lib/images";

/**
 * The wait is part of the journey, so it is narrated rather than spun.
 *
 * Progress is step-based and tied to real pipeline phases — "analyze" covers
 * the multimodal read, "compose" covers grounding and composition. Within a
 * phase the caption advances on a timer but *stops* at the phase's last step
 * and waits there for the network. No invented percentages.
 */

const PHASE_RANGE = {
  analyze: [0, 1],
  compose: [2, 5],
} as const;

export type ProcessingPhase = keyof typeof PHASE_RANGE;

/** Mount this with `key={phase}` so a phase change restarts the sequence. */
export function ProcessingScene({ phase, photos }: { phase: ProcessingPhase; photos: PreparedImage[] }) {
  const { t } = useLanguage();
  const [start, end]: readonly [number, number] = PHASE_RANGE[phase];
  const [step, setStep] = useState(start);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (start >= end) return;

    const timer = setInterval(() => {
      setStep((current) => (current >= end ? current : current + 1));
    }, 2400);

    return () => clearInterval(timer);
  }, [start, end]);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(() => setPhotoIndex((current) => (current + 1) % photos.length), 2800);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl border border-sand/60 bg-sand-light shadow-[0_30px_60px_-40px_rgba(46,41,37,0.65)] lg:max-w-none">
        {photos.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.imageId}
            src={photo.previewUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: index === photoIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" aria-hidden />
      </div>

      <div>
        <ol className="space-y-5" aria-live="polite">
          {t.processing.steps.map((label, index) => {
            const done = index < step;
            const current = index === step;

            return (
              <li key={label} className="flex items-center gap-4">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.62rem] transition-all duration-500 ${
                    done
                      ? "border-green bg-green text-shell"
                      : current
                        ? "border-green text-green"
                        : "border-sand text-sand"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : String(index + 1)}
                </span>

                <span
                  className={`font-serif text-[1.02rem] transition-all duration-500 sm:text-[1.12rem] ${
                    current
                      ? "text-ink"
                      : done
                        ? "text-ink-faint"
                        : "text-ink-faint/45"
                  }`}
                >
                  {label}
                </span>

                {current && (
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1 w-1 animate-pulse rounded-full bg-clay"
                        style={{ animationDelay: `${dot * 180}ms` }}
                      />
                    ))}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 h-px w-full bg-sand/60" aria-hidden>
          <div
            className="h-px bg-green transition-all duration-1000 ease-out"
            style={{ width: `${((step + 1) / t.processing.steps.length) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-[0.86rem] text-ink-faint">{t.processing.hint}</p>
      </div>
    </section>
  );
}
