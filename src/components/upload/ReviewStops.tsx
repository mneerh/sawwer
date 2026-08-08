"use client";

import { useState } from "react";

import { useLanguage } from "@/lib/i18n/context";
import type { PreparedImage } from "@/lib/images";
import type { DetectedPlace } from "@/lib/ai/schemas";

export function ReviewStops({
  places,
  photos,
  unplacedCount,
  onChange,
  onConfirm,
  onBack,
}: {
  places: DetectedPlace[];
  photos: PreparedImage[];
  unplacedCount: number;
  onChange: (places: DetectedPlace[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState("");

  const photoFor = (imageId: string) => photos.find((photo) => photo.imageId === imageId);

  const rename = (id: string, name: string) => {
    onChange(places.map((place) => (place.id === id ? { ...place, name } : place)));
  };

  const removePlace = (id: string) => {
    onChange(places.filter((place) => place.id !== id));
  };

  const addPlace = () => {
    const name = newPlace.trim();
    if (!name) return;
    onChange([
      ...places,
      {
        id: `place-manual-${Date.now().toString(36)}`,
        name,
        city: null,
        imageIds: [],
        confidence: 1,
        uncertain: false,
      },
    ]);
    setNewPlace("");
  };

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-28">
      <p className="text-[0.72rem] uppercase tracking-[0.3em] text-clay">{t.review.kicker}</p>
      <h1 className="mt-5 font-display text-[clamp(1.9rem,4.6vw,2.9rem)] leading-tight text-ink">
        {places.length > 0 ? t.review.title(places.length) : t.review.emptyTitle}
      </h1>
      <p className="mt-4 font-serif text-[1rem] leading-[1.9] text-ink-soft">
        {places.length > 0 ? t.review.subtitle : t.review.emptyBody}
      </p>

      <ul className="mt-12 divide-y divide-sand/60 border-y border-sand/60">
        {places.map((place, index) => (
          <li key={place.id} className="flex items-center gap-4 py-4 sm:gap-5">
            <span className="font-display text-[1.35rem] text-sand tabular">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="flex -space-x-2 rtl:space-x-reverse" aria-hidden>
              {place.imageIds.slice(0, 3).map((imageId) => {
                const photo = photoFor(imageId);
                return photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={imageId}
                    src={photo.previewUrl}
                    alt=""
                    className="h-11 w-11 rounded-md border-2 border-shell object-cover"
                  />
                ) : null;
              })}
            </div>

            <div className="min-w-0 flex-1">
              {editing === place.id ? (
                <input
                  autoFocus
                  value={place.name}
                  onChange={(event) => rename(place.id, event.target.value)}
                  onBlur={() => setEditing(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape") setEditing(null);
                  }}
                  aria-label={t.review.rename}
                  className="w-full border-b border-green bg-transparent pb-1 font-display text-[1.15rem] text-ink outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(place.id)}
                  title={t.review.rename}
                  className="block max-w-full truncate text-start font-display text-[1.15rem] text-ink transition-colors hover:text-green"
                >
                  {place.name}
                </button>
              )}

              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-ink-faint">
                {place.imageIds.length > 0 && <span>{t.review.photos(place.imageIds.length)}</span>}
                {place.city && <span>· {place.city}</span>}
                {place.uncertain && (
                  <span className="rounded-full bg-gold/18 px-2 py-0.5 text-[0.7rem] text-clay">
                    {t.review.uncertain}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removePlace(place.id)}
              aria-label={`${t.review.removePlace}: ${place.name}`}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[0.85rem] text-ink-faint transition-colors hover:bg-terracotta/10 hover:text-terracotta"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {unplacedCount > 0 && <p className="mt-4 text-[0.82rem] text-ink-faint">{t.review.unplaced(unplacedCount)}</p>}

      <div className="mt-8 flex items-center gap-3">
        <input
          value={newPlace}
          onChange={(event) => setNewPlace(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addPlace();
            }
          }}
          placeholder={t.review.newPlace}
          aria-label={t.review.newPlace}
          className="w-full max-w-xs rounded-full border border-sand bg-transparent px-5 py-2.5 text-[0.9rem] text-ink outline-none transition-colors placeholder:text-ink-faint/60 focus:border-green"
        />
        <button
          type="button"
          onClick={addPlace}
          className="shrink-0 rounded-full border border-sand px-5 py-2.5 text-[0.85rem] text-ink-soft transition-colors hover:border-green hover:text-green"
        >
          {t.review.addPlace}
        </button>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={onConfirm}
          disabled={places.length === 0}
          className="rounded-full bg-green px-9 py-3.5 text-[0.95rem] text-shell transition-all hover:-translate-y-0.5 hover:bg-green-deep disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-faint disabled:hover:translate-y-0"
        >
          {t.review.cta}
        </button>
        <button type="button" onClick={onBack} className="text-[0.9rem] text-ink-faint transition-colors hover:text-ink">
          {t.common.back}
        </button>
      </div>
    </section>
  );
}
