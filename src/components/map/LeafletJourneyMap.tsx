"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import { formatTime } from "@/lib/datetime";
import { boundsOf, isUsableCoordinate } from "@/lib/geo";
import { useLanguage } from "@/lib/i18n/context";
import type { Journey, JourneyStop } from "@/lib/ai/schemas";

/**
 * The journey map: OpenStreetMap tiles rendered through Leaflet.
 *
 * No API key, no SDK, no billing account. Coordinates arrive already attached
 * to each stop — from the photo's own EXIF GPS, from Google Places when it is
 * configured, or from the built-in gazetteer — so this component only draws
 * what it is given and never geocodes anything itself.
 *
 * This module must only ever be loaded client-side: Leaflet touches `window`
 * at import time. `JourneyMap` handles that with a dynamic, ssr:false import.
 */

type PlottedStop = {
  stop: JourneyStop;
  index: number;
  position: [number, number];
};

export default function LeafletJourneyMap({
  journey,
  onSelectStop,
}: {
  journey: Journey;
  onSelectStop?: (stopId: string) => void;
}) {
  const { t, locale } = useLanguage();

  // A stop without usable coordinates is simply not plotted. It keeps its place
  // in the timeline — the map is a view of the journey, not the journey itself.
  const plotted = useMemo<PlottedStop[]>(
    () =>
      journey.stops
        .filter((stop) => isUsableCoordinate(stop.coordinates))
        .map((stop, index) => ({
          stop,
          index,
          position: [stop.coordinates!.lat, stop.coordinates!.lng] as [number, number],
        })),
    [journey.stops],
  );

  if (plotted.length === 0) return null;

  const path = plotted.map((entry) => entry.position);

  return (
    <div className="relative isolate h-[26rem] w-full overflow-hidden rounded-xl sm:h-[32rem]">
      <MapContainer
        center={path[0]}
        zoom={15}
        // Wheel zoom off so scrolling the story never gets trapped by the map.
        // The zoom control (and pinch, on touch) covers the intent explicitly.
        scrollWheelZoom={false}
        zoomControl
        attributionControl
        className="h-full w-full"
        style={{ background: "var(--color-sand-light)" }}
      >
        {/*
          Standard OSM tiles, warmed with a CSS filter (see globals.css) so the
          basemap sits inside the Sawwer palette instead of shouting over it.
          Attribution is required by the OSM tile usage policy.
        */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: "#006C35", weight: 2.5, opacity: 0.75, dashArray: "7 9", lineCap: "round" }}
          />
        )}

        {plotted.map(({ stop, index, position }) => (
          <Marker key={stop.id} position={position} icon={numberedPin(index + 1)} zIndexOffset={index}>
            <Popup closeButton={false} className="sawwer-popup" maxWidth={260} minWidth={180}>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-clay">
                {t.journey.stopLabel} {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1.5 font-display text-[1.05rem] leading-tight text-ink">
                {stop.placeName || t.journey.unnamedPlace}
              </p>
              <p className="mt-1 text-[0.75rem] text-ink-faint">
                {formatTime(stop.capturedAt, locale) ?? t.journey.noTime}
              </p>
              {stop.narrative && (
                <p className="mt-2 font-serif text-[0.8rem] leading-[1.7] text-ink-soft">{excerpt(stop.narrative)}</p>
              )}

              {/* Jumping to the stop is offered, not automatic — scrolling the
                  page the instant a popup opens would yank the map away from
                  the reader who just tapped it. */}
              {onSelectStop && (
                <button
                  type="button"
                  onClick={() => onSelectStop(stop.id)}
                  className="mt-3 text-[0.75rem] text-green underline decoration-dotted underline-offset-4"
                >
                  {t.journey.goToStop}
                </button>
              )}
            </Popup>
          </Marker>
        ))}

        <FitToJourney path={path} />
      </MapContainer>
    </div>
  );
}

/**
 * Frames the whole trip. With one stop there is nothing to fit, so it centres
 * at a street-level zoom instead of Leaflet's degenerate max-zoom behaviour.
 */
function FitToJourney({ path }: { path: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (path.length === 0) return;

    const fit = () => {
      if (path.length === 1) {
        map.setView(path[0], 16, { animate: false });
        return;
      }

      const { minLat, maxLat, minLng, maxLng } = boundsOf(path.map(([lat, lng]) => ({ lat, lng })));

      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        // Padding keeps pins clear of the zoom control and the attribution.
        { padding: [56, 56], maxZoom: 17, animate: false },
      );
    };

    fit();

    // The map often mounts before its container has its final size — inside a
    // reveal animation, or on a viewport change — and Leaflet computes bounds
    // against the size it *had*. Re-measure and re-fit whenever that changes,
    // otherwise the trip ends up cropped on mobile.
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      fit();
    });
    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map, path]);

  return null;
}

/**
 * A brand pin drawn as a divIcon.
 *
 * This also sidesteps Leaflet's well-known Next.js problem: the default marker
 * points at bundler-rewritten PNG paths that resolve to 404s. There is no image
 * asset here at all, so there is nothing to break.
 */
function numberedPin(number: number): L.DivIcon {
  return L.divIcon({
    className: "sawwer-pin",
    html: `<span class="sawwer-pin__dot">${number}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function excerpt(text: string, limit = 120): string {
  const clean = text.trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", limit))}…`;
}
