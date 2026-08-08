"use client";

import { useMemo, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { boundsOf, directionsUrl, mapsEmbedUrl } from "@/lib/google/maps";
import { useLanguage } from "@/lib/i18n/context";
import type { Journey } from "@/lib/ai/schemas";

/**
 * Google Maps is optional. With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set we embed
 * the real map; without it we draw our own — which is a deliberate design
 * choice rather than an error state, so a missing key never degrades the demo.
 * Deep links to Google Maps work in both cases, since they need no key.
 */
export function JourneyMap({ journey, onSelectStop }: { journey: Journey; onSelectStop?: (stopId: string) => void }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<string | null>(null);

  const locations = journey.mapLocations;
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const embedUrl = embedKey ? mapsEmbedUrl(locations, embedKey) : null;
  const routeUrl = directionsUrl(locations);

  if (locations.length === 0) return null;

  return (
    <section className="border-y border-sand/60 bg-sand-light/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] text-ink">{t.journey.mapTitle}</h2>
          <p className="mt-3 font-serif text-[0.98rem] text-ink-soft">{t.journey.mapSubtitle}</p>
        </Reveal>

        <Reveal delay={100} className="mt-10 overflow-hidden rounded-xl border border-sand/70 bg-shell">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={t.journey.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[26rem] w-full border-0 sm:h-[32rem]"
              allowFullScreen
            />
          ) : (
            <IllustratedMap
              journey={journey}
              active={active}
              onHover={setActive}
              onSelect={(stopId) => {
                setActive(stopId);
                onSelectStop?.(stopId);
              }}
            />
          )}
        </Reveal>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {!embedUrl && <p className="text-[0.78rem] text-ink-faint">{t.journey.mapFallbackNote}</p>}
          {routeUrl && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.85rem] text-clay underline decoration-dotted underline-offset-4 transition-colors hover:text-green"
            >
              {t.journey.openInMaps}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const WIDTH = 1000;
const HEIGHT = 560;
const PADDING = 110;

function IllustratedMap({
  journey,
  active,
  onHover,
  onSelect,
}: {
  journey: Journey;
  active: string | null;
  onHover: (stopId: string | null) => void;
  onSelect: (stopId: string) => void;
}) {
  const points = useMemo(() => {
    const coordinates = journey.mapLocations.map((location) => location.coordinates);
    const { minLat, maxLat, minLng, maxLng } = boundsOf(coordinates);

    // Guard against a single stop (or perfectly aligned stops) collapsing the span.
    const latSpan = Math.max(maxLat - minLat, 0.004);
    const lngSpan = Math.max(maxLng - minLng, 0.004);

    const placed = journey.mapLocations.map((location, index) => ({
      ...location,
      index,
      // Longitude grows eastward → x; latitude grows northward → inverted y.
      x: PADDING + ((location.coordinates.lng - minLng) / lngSpan) * (WIDTH - PADDING * 2),
      y: HEIGHT - PADDING - ((location.coordinates.lat - minLat) / latSpan) * (HEIGHT - PADDING * 2),
    }));

    // Real heritage sites sit close together — Salwa Palace is ~60m from
    // At-Turaif — so labels genuinely collide. Try offsets above and below the
    // pin until one is clear of every label already placed.
    const CANDIDATES = [-30, 40, -56, 66, -82, 92];
    const boxes: Array<{ x1: number; x2: number; y1: number; y2: number }> = [];

    return placed.map((point) => {
      const halfWidth = Math.max(38, point.label.length * 4.6);

      const dy =
        CANDIDATES.find((candidate) => {
          const box = {
            x1: point.x - halfWidth,
            x2: point.x + halfWidth,
            y1: point.y + candidate - 13,
            y2: point.y + candidate + 7,
          };
          return !boxes.some(
            (other) => box.x1 < other.x2 && box.x2 > other.x1 && box.y1 < other.y2 && box.y2 > other.y1,
          );
        }) ?? CANDIDATES[0];

      boxes.push({
        x1: point.x - halfWidth,
        x2: point.x + halfWidth,
        y1: point.y + dy - 13,
        y2: point.y + dy + 7,
      });

      return { ...point, labelDy: dy };
    });
  }, [journey.mapLocations]);

  const route = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[26rem] w-full sm:h-[32rem]" role="img" aria-label={journey.title}>
      <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6F1E6" />
          <stop offset="100%" stopColor="#EFE5D2" />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#map-bg)" />

      {/* contour lines, evoking the wadi terrain without pretending to be data */}
      {Array.from({ length: 7 }).map((_, index) => (
        <path
          key={index}
          d={`M -40 ${90 + index * 70} C 200 ${40 + index * 70}, 420 ${150 + index * 70}, 660 ${80 + index * 70} S 980 ${
            130 + index * 70
          }, 1040 ${100 + index * 70}`}
          fill="none"
          stroke="#D9C5A4"
          strokeWidth="1"
          opacity={0.5}
        />
      ))}

      {/* graticule */}
      {Array.from({ length: 9 }).map((_, index) => (
        <line key={`v${index}`} x1={index * 125} y1="0" x2={index * 125} y2={HEIGHT} stroke="#D9C5A4" strokeWidth="0.5" opacity="0.35" />
      ))}
      {Array.from({ length: 5 }).map((_, index) => (
        <line key={`h${index}`} x1="0" y1={index * 140} x2={WIDTH} y2={index * 140} stroke="#D9C5A4" strokeWidth="0.5" opacity="0.35" />
      ))}

      {points.length > 1 && (
        <path d={route} fill="none" stroke="#006C35" strokeWidth="1.8" strokeDasharray="7 8" opacity="0.55" strokeLinecap="round" />
      )}

      {points.map((point) => {
        const isActive = active === point.stopId;
        return (
          <g
            key={point.stopId}
            transform={`translate(${point.x} ${point.y})`}
            className="cursor-pointer"
            onMouseEnter={() => onHover(point.stopId)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(point.stopId)}
            role="button"
            tabIndex={0}
            aria-label={point.label}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(point.stopId);
              }
            }}
          >
            <circle r={isActive ? 26 : 20} fill="#006C35" opacity={isActive ? 0.14 : 0.08} />
            <circle r={isActive ? 13 : 11} fill="#006C35" />
            <circle r={isActive ? 13 : 11} fill="none" stroke="#FAF8F3" strokeWidth="2.5" />
            <text
              textAnchor="middle"
              dy="4"
              fill="#FAF8F3"
              fontSize="10"
              fontFamily="Thmanyah, system-ui, sans-serif"
              style={{ pointerEvents: "none" }}
            >
              {point.index + 1}
            </text>

            <g transform={`translate(0 ${point.labelDy})`} style={{ pointerEvents: "none" }}>
              {/* A hairline back to the pin, so a displaced label stays attached to it. */}
              <line
                x1="0"
                y1={point.labelDy < 0 ? 6 : -16}
                x2="0"
                y2={point.labelDy < 0 ? -point.labelDy - 14 : -point.labelDy + 14}
                stroke="#B79A72"
                strokeWidth="1"
                opacity="0.7"
              />
              <text
                textAnchor="middle"
                fill="#2E2925"
                fontSize={isActive ? "17" : "15"}
                fontFamily="Thmanyah Display, Thmanyah, serif"
                stroke="#F6F1E6"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {point.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
