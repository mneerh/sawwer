"use client";

import { useCallback, useRef, useState } from "react";

import { useLanguage } from "@/lib/i18n/context";
import { ACCEPTED_TYPES, MAX_FILES } from "@/lib/images";

export function PhotoDropzone({
  onFiles,
  disabled,
  count,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  count: number;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  const full = count >= MAX_FILES;

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !full) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled || full) return;
        handleFiles(event.dataTransfer.files);
      }}
      className={`relative rounded-xl border border-dashed px-6 py-14 text-center transition-all sm:py-16 ${
        dragging ? "border-green bg-sand-light/70" : "border-sand hover:border-clay/60 hover:bg-sand-light/35"
      } ${disabled || full ? "opacity-55" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="sr-only"
        disabled={disabled || full}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Allow re-picking the same file after a removal.
          event.target.value = "";
        }}
      />

      <svg
        viewBox="0 0 48 48"
        className="mx-auto h-11 w-11 text-clay/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden
      >
        <rect x="5" y="12" width="38" height="27" rx="3.5" />
        <path d="M16 12l2.6-4.4h10.8L32 12" />
        <circle cx="24" cy="25.5" r="7.5" />
      </svg>

      <p className="mt-6 font-display text-[1.4rem] text-ink">{t.create.dropTitle}</p>
      <p className="mt-2 text-[0.92rem] text-ink-faint">{t.create.dropSubtitle}</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || full}
        className="mt-7 rounded-full border border-green/35 px-7 py-2.5 text-[0.9rem] text-green transition-colors hover:bg-green hover:text-shell disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green"
      >
        {t.create.browse}
      </button>

      <p className="mt-6 text-[0.75rem] tracking-wide text-ink-faint/80">{t.create.dropFormats}</p>
    </div>
  );
}
