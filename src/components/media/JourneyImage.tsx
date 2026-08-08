"use client";

import { useEffect, useState } from "react";

import { DemoPhoto } from "@/components/media/DemoPhoto";
import { getImageUrl, isDemoImage } from "@/lib/storage/journeys";

/**
 * Renders a photo by id, whichever kind it is: an illustrated demo scene,
 * a blob from IndexedDB, or a direct object URL held in memory during the
 * create flow.
 */
export function JourneyImage({
  imageId,
  alt,
  className = "",
  directUrl,
  priority = false,
}: {
  imageId: string | null;
  alt: string;
  className?: string;
  /** Bypasses storage — used while photos are still only in memory. */
  directUrl?: string;
  priority?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(directUrl ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (directUrl || !imageId || isDemoImage(imageId)) return;

    let active = true;
    getImageUrl(imageId).then((resolved) => {
      if (!active) return;
      if (resolved) setUrl(resolved);
      else setFailed(true);
    });

    return () => {
      active = false;
    };
  }, [imageId, directUrl]);

  if (!imageId) return <MissingPhoto className={className} />;

  if (isDemoImage(imageId)) {
    return (
      <div className={`overflow-hidden bg-sand-mid ${className}`}>
        <DemoPhoto imageId={imageId} />
      </div>
    );
  }

  if (url) {
    return (
      // Blob URLs from IndexedDB can't go through next/image, which needs a
      // path or a configured remote host.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`object-cover ${className}`}
      />
    );
  }

  if (failed) return <MissingPhoto className={className} />;

  return <div className={`animate-pulse bg-sand-mid ${className}`} aria-hidden />;
}

function MissingPhoto({ className = "" }: { className?: string }) {
  return (
    <div className={`grid place-items-center bg-sand-light ${className}`} aria-hidden>
      <svg viewBox="0 0 48 48" className="h-10 w-10 text-sand" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <circle cx="17" cy="20" r="3" />
        <path d="M9 34l11-11 8 8 5-5 6 6" />
      </svg>
    </div>
  );
}
