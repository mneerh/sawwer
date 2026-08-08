"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n/context";
import type { PreparedImage } from "@/lib/images";

export function PhotoGrid({
  photos,
  onRemove,
  onMove,
}: {
  photos: PreparedImage[];
  onRemove: (imageId: string) => void;
  onMove: (imageId: string, direction: -1 | 1) => void;
}) {
  const { t, dir } = useLanguage();
  const [previewing, setPreviewing] = useState<PreparedImage | null>(null);

  useEffect(() => {
    if (!previewing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewing]);

  if (photos.length === 0) return null;

  // In RTL the "forward" arrow points left, so the glyphs follow the reading direction.
  const backGlyph = dir === "rtl" ? "→" : "←";
  const forwardGlyph = dir === "rtl" ? "←" : "→";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <figure
            key={photo.imageId}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-sand/60 bg-sand-light"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.previewUrl}
              alt={photo.fileName}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />

            <span className="absolute top-2.5 start-2.5 rounded-full bg-ink/55 px-2 py-0.5 text-[0.68rem] text-shell tabular backdrop-blur-sm">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/80 to-transparent p-2 opacity-0 transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100">
              <div className="flex gap-1">
                <IconButton
                  label={t.create.moveBack}
                  onClick={() => onMove(photo.imageId, -1)}
                  disabled={index === 0}
                >
                  {backGlyph}
                </IconButton>
                <IconButton
                  label={t.create.moveForward}
                  onClick={() => onMove(photo.imageId, 1)}
                  disabled={index === photos.length - 1}
                >
                  {forwardGlyph}
                </IconButton>
              </div>

              <div className="flex gap-1">
                <IconButton label={t.create.preview} onClick={() => setPreviewing(photo)}>
                  ⤢
                </IconButton>
                <IconButton label={t.create.remove} onClick={() => onRemove(photo.imageId)} tone="danger">
                  ✕
                </IconButton>
              </div>
            </div>
          </figure>
        ))}
      </div>

      {previewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewing.fileName}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 p-5 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewing(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewing.previewUrl}
            alt={previewing.fileName}
            className="max-h-[86vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreviewing(null)}
            className="absolute top-5 end-5 rounded-full border border-shell/40 px-4 py-2 text-sm text-shell transition-colors hover:bg-shell hover:text-ink"
          >
            {t.create.closePreview}
          </button>
        </div>
      )}
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-full text-[0.72rem] leading-none backdrop-blur-sm transition-colors disabled:opacity-30 ${
        tone === "danger"
          ? "bg-shell/90 text-terracotta hover:bg-terracotta hover:text-shell"
          : "bg-shell/85 text-ink hover:bg-shell"
      }`}
    >
      {children}
    </button>
  );
}
