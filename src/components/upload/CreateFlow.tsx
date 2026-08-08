"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { PhotoDropzone } from "@/components/upload/PhotoDropzone";
import { PhotoGrid } from "@/components/upload/PhotoGrid";
import { ProcessingScene, type ProcessingPhase } from "@/components/upload/ProcessingScene";
import { ReviewStops } from "@/components/upload/ReviewStops";
import { JourneySchema, type DetectedPlace, type ImageAnalysis } from "@/lib/ai/schemas";
import { useLanguage } from "@/lib/i18n/context";
import { createId, isAcceptedType, MAX_FILE_BYTES, MAX_FILES, prepareImage, type PreparedImage } from "@/lib/images";
import { saveImage, saveJourney } from "@/lib/storage/journeys";

type Stage = "upload" | "processing" | "review";

export function CreateFlow() {
  const { t } = useLanguage();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("upload");
  const [phase, setPhase] = useState<ProcessingPhase>("analyze");
  const [photos, setPhotos] = useState<PreparedImage[]>([]);
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [places, setPlaces] = useState<DetectedPlace[]>([]);
  const [unplacedCount, setUnplacedCount] = useState(0);
  const analysesRef = useRef<ImageAnalysis[]>([]);
  const journeyIdRef = useRef<string>("");

  /* ----------------------------- uploading ---------------------------- */

  const addFiles = useCallback(
    async (files: File[]) => {
      setErrors([]);
      const problems: string[] = [];
      const accepted: File[] = [];

      for (const file of files) {
        if (!isAcceptedType(file)) problems.push(t.create.badType(file.name));
        else if (file.size > MAX_FILE_BYTES) problems.push(t.create.tooLarge(file.name));
        else accepted.push(file);
      }

      const room = MAX_FILES - photos.length;
      if (accepted.length > room) problems.push(t.create.tooMany);

      setBusy(true);
      try {
        const prepared: PreparedImage[] = [];

        for (const file of accepted.slice(0, Math.max(0, room))) {
          try {
            prepared.push(await prepareImage(file, createId("img")));
          } catch {
            problems.push(t.create.badType(file.name));
          }
        }

        if (prepared.length > 0) setPhotos((current) => [...current, ...prepared].slice(0, MAX_FILES));
      } finally {
        setBusy(false);
        if (problems.length > 0) setErrors(problems);
      }
    },
    [photos.length, t],
  );

  const removePhoto = (imageId: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.imageId === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.imageId !== imageId);
    });
  };

  const movePhoto = (imageId: string, direction: -1 | 1) => {
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.imageId === imageId);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return reordered;
    });
  };

  /* ------------------------------ analysis ---------------------------- */

  const runAnalysis = async () => {
    if (photos.length === 0) return;

    setFatalError(null);
    setPhase("analyze");
    setStage("processing");
    journeyIdRef.current = createId("journey");

    try {
      // Photos are persisted before generation, so a failed journey still
      // leaves the traveller's uploads intact for a retry.
      await Promise.all(photos.map((photo) => saveImage(photo.imageId, journeyIdRef.current, photo.blob)));

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((photo) => ({
            imageId: photo.imageId,
            mimeType: photo.analysisMimeType,
            data: photo.analysisBase64,
          })),
          tripHint: [tripName.trim(), destination.trim()].filter(Boolean).join(" — ") || null,
        }),
      });

      if (!response.ok) throw new Error(`analyze:${response.status}`);

      const data = (await response.json()) as {
        analyses: ImageAnalysis[];
        detectedPlaces: DetectedPlace[];
        unplacedImageIds: string[];
        probableDestination: string | null;
      };

      analysesRef.current = data.analyses ?? [];
      setPlaces(data.detectedPlaces ?? []);
      setUnplacedCount(data.unplacedImageIds?.length ?? 0);
      if (!destination && data.probableDestination) setDestination(data.probableDestination);
      setStage("review");
    } catch (error) {
      console.error(error);
      setFatalError(t.processing.failed);
    }
  };

  /* --------------------------- journey build -------------------------- */

  const buildJourney = async () => {
    setFatalError(null);
    setPhase("compose");
    setStage("processing");

    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId: journeyIdRef.current,
          analyses: analysesRef.current,
          places: places.map((place) => ({
            id: place.id,
            name: place.name,
            city: place.city ?? (destination.trim() || null),
            imageIds: place.imageIds,
          })),
          tripName: tripName.trim() || null,
          imageIds: photos.map((photo) => photo.imageId),
        }),
      });

      if (!response.ok) throw new Error(`journey:${response.status}`);

      const data = await response.json();
      const journey = JourneySchema.parse(data.journey);

      await saveJourney(journey);
      router.push(`/journey/${journey.id}`);
    } catch (error) {
      console.error(error);
      setFatalError(t.processing.failed);
    }
  };

  /* ------------------------------ render ------------------------------ */

  if (fatalError) {
    return (
      <section className="mx-auto max-w-xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-[2rem] text-ink">{fatalError}</h1>
        <p className="mt-4 font-serif text-ink-soft">{t.common.error}</p>
        <div className="mt-10 flex justify-center gap-5">
          <button
            type="button"
            onClick={() => {
              setFatalError(null);
              setStage(places.length > 0 ? "review" : "upload");
            }}
            className="rounded-full bg-green px-8 py-3 text-[0.92rem] text-shell transition-colors hover:bg-green-deep"
          >
            {t.processing.retry}
          </button>
          <button
            type="button"
            onClick={() => {
              setFatalError(null);
              setStage("upload");
            }}
            className="text-[0.9rem] text-ink-faint transition-colors hover:text-ink"
          >
            {t.processing.back}
          </button>
        </div>
      </section>
    );
  }

  // Keyed by phase so the narrated sequence restarts cleanly at each stage.
  if (stage === "processing") return <ProcessingScene key={phase} phase={phase} photos={photos} />;

  if (stage === "review") {
    return (
      <ReviewStops
        places={places}
        photos={photos}
        unplacedCount={unplacedCount}
        onChange={setPlaces}
        onConfirm={buildJourney}
        onBack={() => setStage("upload")}
      />
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8 sm:py-28">
      <h1 className="font-display text-[clamp(2rem,5vw,3.1rem)] leading-tight text-ink">{t.create.title}</h1>
      <p className="mt-4 max-w-xl font-serif text-[1.02rem] leading-[1.9] text-ink-soft">{t.create.subtitle}</p>

      <div className="mt-12">
        <PhotoDropzone onFiles={addFiles} disabled={busy} count={photos.length} />
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1" role="alert">
          {errors.map((message) => (
            <li key={message} className="text-[0.84rem] text-terracotta">
              {message}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="mt-10">
          <p className="mb-4 text-[0.8rem] uppercase tracking-[0.2em] text-ink-faint">
            {t.create.photosCount(photos.length)}
          </p>
          <PhotoGrid photos={photos} onRemove={removePhoto} onMove={movePhoto} />
        </div>
      )}

      <div className="mt-14 grid gap-8 border-t border-sand/60 pt-12 sm:grid-cols-2">
        <Field
          label={t.create.tripNameLabel}
          placeholder={t.create.tripNamePlaceholder}
          value={tripName}
          onChange={setTripName}
        />
        <Field
          label={t.create.destinationLabel}
          placeholder={t.create.destinationPlaceholder}
          value={destination}
          onChange={setDestination}
          hint={t.create.destinationHint}
        />
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={runAnalysis}
          disabled={photos.length === 0 || busy}
          className="rounded-full bg-green px-9 py-3.5 text-[0.95rem] text-shell transition-all hover:-translate-y-0.5 hover:bg-green-deep disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-faint disabled:hover:translate-y-0"
        >
          {busy ? t.common.loading : t.create.cta}
        </button>
        {photos.length === 0 && <p className="text-[0.85rem] text-ink-faint">{t.create.emptyHint}</p>}
      </div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] uppercase tracking-[0.16em] text-ink-faint">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full border-b border-sand bg-transparent pb-2.5 font-display text-[1.15rem] text-ink outline-none transition-colors placeholder:font-sans placeholder:text-[0.95rem] placeholder:text-ink-faint/50 focus:border-green"
      />
      {hint && <span className="mt-2.5 block text-[0.78rem] text-ink-faint/85">{hint}</span>}
    </label>
  );
}
