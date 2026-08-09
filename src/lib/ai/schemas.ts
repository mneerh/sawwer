import { z } from "zod";

/**
 * Every structured payload that crosses an AI boundary is validated here.
 * Gemini responses are parsed with these schemas before they are allowed
 * anywhere near the UI — a malformed model response degrades gracefully
 * instead of rendering broken journeys.
 */

/* ------------------------------------------------------------------ */
/* Stage 0 — photo metadata (extracted in the browser, before Gemini)   */
/* ------------------------------------------------------------------ */

/**
 * Where a photo's timestamp came from, in descending order of trust.
 * This is carried all the way to the UI so a time is never shown with more
 * authority than its source deserves.
 */
export const MetadataSourceSchema = z.enum([
  "exif_datetime_original",
  "exif_create_date",
  "file_metadata",
  "upload_order",
]);
export type MetadataSource = z.infer<typeof MetadataSourceSchema>;

export const ImageMetadataSchema = z.object({
  imageId: z.string(),
  fileName: z.string(),
  /**
   * Local wall-clock time exactly as the camera recorded it:
   * "YYYY-MM-DDTHH:mm:ss", deliberately with no timezone suffix.
   * EXIF carries no zone, so converting to UTC would invent information and
   * shift the time the traveller actually experienced.
   */
  capturedAt: z.string().nullable(),
  captureDate: z.string().nullable(),
  captureTime: z.string().nullable(),
  /** From EXIF OffsetTimeOriginal when present, e.g. "+03:00". Display only. */
  timezone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  metadataSource: MetadataSourceSchema,
  /** True only when capturedAt came from a trustworthy capture-time source. */
  hasReliableTimestamp: z.boolean(),
  /** Position in the user's original selection — the last-resort ordering key. */
  uploadIndex: z.number().int(),
});
export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

/* ------------------------------------------------------------------ */
/* Stage 1 — multimodal image understanding                            */
/* ------------------------------------------------------------------ */

/** Exactly what Gemini is asked to return about a single photograph. */
export const ImageObservationSchema = z.object({
  imageId: z.string(),
  possiblePlace: z.string().nullable(),
  possibleLandmark: z.string().nullable(),
  city: z.string().nullable(),
  visualDescription: z.string(),
  heritageElements: z.array(z.string()).default([]),
  visibleText: z.array(z.string()).default([]),
  timeOfDay: z.enum(["morning", "midday", "afternoon", "sunset", "night", "unknown"]).default("unknown"),
  /** 0–1. Below UNCERTAIN_THRESHOLD the place is shown to the user as unconfirmed. */
  confidence: z.number().min(0).max(1),
});
export type ImageObservation = z.infer<typeof ImageObservationSchema>;

/**
 * The model's observation joined back to the photo's own metadata. The
 * metadata is never discarded after analysis — it is what orders the journey.
 */
export const ImageAnalysisSchema = ImageObservationSchema.extend({
  metadata: ImageMetadataSchema,
});
export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

export const ObservationResultSchema = z.object({
  images: z.array(ImageObservationSchema),
  probableDestination: z.string().nullable(),
});
export type ObservationResult = z.infer<typeof ObservationResultSchema>;

/** Below this, we never present the model's guess as a fact. */
export const UNCERTAIN_THRESHOLD = 0.55;

/* ------------------------------------------------------------------ */
/* Stage 2 — place resolution (function calling) + grounding           */
/* ------------------------------------------------------------------ */

export const PlaceDetailsSchema = z.object({
  name: z.string(),
  formattedAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  googleMapsUrl: z.string().nullable(),
  placeId: z.string().nullable(),
  /** Where the coordinates came from — surfaced in the UI for honesty. */
  source: z.enum(["google-places", "gazetteer", "model"]),
});
export type PlaceDetails = z.infer<typeof PlaceDetailsSchema>;

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const GroundedFactSchema = z.object({
  placeName: z.string(),
  fact: z.string(),
  sources: z.array(SourceSchema).default([]),
  /** true only when Google Search grounding actually returned citations. */
  verified: z.boolean(),
});
export type GroundedFact = z.infer<typeof GroundedFactSchema>;

/* ------------------------------------------------------------------ */
/* Stage 3 — the journey itself (structured output)                    */
/* ------------------------------------------------------------------ */

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const JourneyStopSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  imageIds: z.array(z.string()).default([]),
  placeName: z.string(),
  location: z.string(),
  title: z.string(),
  /** Personal, evocative narrative. Explicitly *not* presented as fact. */
  narrative: z.string(),
  /** Grounded historical note. null when nothing could be verified. */
  verifiedFact: z.string().nullable(),
  sources: z.array(SourceSchema).default([]),
  coordinates: CoordinatesSchema.nullable(),
  googleMapsUrl: z.string().nullable(),
  confidence: z.number().min(0).max(1),

  /* --- chronology, derived from photo metadata and never from the model --- */

  /** Earliest capture time in the stop, local wall clock. null when unknown. */
  capturedAt: z.string().nullable().default(null),
  /** Last capture time in the stop — the stop's span, when more than one photo. */
  endedAt: z.string().nullable().default(null),
  /** "HH:mm" 24h local. The UI localises it; this stays machine-readable. */
  displayTime: z.string().nullable().default(null),
  /** "YYYY-MM-DD" of the stop, when any photo in it carries a date. */
  date: z.string().nullable().default(null),
  /** 1-based day of the trip. Always 1 for a single-day journey. */
  dayNumber: z.number().int().default(1),
  /** Highest-trust metadata source among this stop's photos. */
  timeSource: MetadataSourceSchema.default("upload_order"),
});
export type JourneyStop = z.infer<typeof JourneyStopSchema>;

export const JourneyDaySchema = z.object({
  dayNumber: z.number().int(),
  date: z.string().nullable(),
  stopIds: z.array(z.string()),
});
export type JourneyDay = z.infer<typeof JourneyDaySchema>;

export const JourneySummarySchema = z.object({
  numberOfPhotos: z.number().int(),
  numberOfPlaces: z.number().int(),
  majorLandmarks: z.array(z.string()).default([]),
  discoveredFactsCount: z.number().int(),
  closingText: z.string(),
});
export type JourneySummary = z.infer<typeof JourneySummarySchema>;

export const MapLocationSchema = z.object({
  stopId: z.string(),
  label: z.string(),
  coordinates: CoordinatesSchema,
});
export type MapLocation = z.infer<typeof MapLocationSchema>;

export const JourneySchema = z.object({
  id: z.string(),
  title: z.string(),
  destination: z.string(),
  /** First capture date of the trip — from the photos, never from "today". */
  date: z.string().nullable(),
  /** Last capture date. Equal to `date` for a single-day trip. */
  endDate: z.string().nullable().default(null),
  /** Chronological day buckets. A single-day trip has exactly one. */
  days: z.array(JourneyDaySchema).default([]),
  coverImageId: z.string().nullable(),
  shortIntro: z.string(),
  stops: z.array(JourneyStopSchema),
  summary: JourneySummarySchema,
  mapLocations: z.array(MapLocationSchema).default([]),
  createdAt: z.string(),
  /** "live" = produced by Gemini. "demo" = sample content, never claimed as AI output. */
  mode: z.enum(["live", "demo"]),
});
export type Journey = z.infer<typeof JourneySchema>;

/**
 * What Gemini is asked to return for the journey composition step.
 *
 * Note what is *absent*: order, grouping, times and image assignment. Those
 * are computed from photo metadata before the model is called, and the model
 * is handed the finished stop list to write about. Ids, coordinates and
 * sources are attached by our own code afterwards, so the model is never asked
 * to invent a URL, a lat/lng, or a chronology.
 */
export const JourneyDraftSchema = z.object({
  title: z.string(),
  destination: z.string(),
  shortIntro: z.string(),
  stops: z.array(
    z.object({
      stopId: z.string(),
      title: z.string(),
      narrative: z.string(),
    }),
  ),
  closingText: z.string(),
  majorLandmarks: z.array(z.string()).default([]),
});
export type JourneyDraft = z.infer<typeof JourneyDraftSchema>;

/* ------------------------------------------------------------------ */
/* Review step + Ask-about-my-trip                                     */
/* ------------------------------------------------------------------ */

/**
 * A candidate stop shown on the review screen. Already grouped and already in
 * chronological order — the user is confirming places, not sequence.
 */
export const DetectedPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  imageIds: z.array(z.string()),
  confidence: z.number(),
  uncertain: z.boolean(),
  capturedAt: z.string().nullable().default(null),
  displayTime: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  dayNumber: z.number().int().default(1),
  timeSource: MetadataSourceSchema.default("upload_order"),
});
export type DetectedPlace = z.infer<typeof DetectedPlaceSchema>;

export const AskAnswerSchema = z.object({
  answer: z.string(),
  relatedStopId: z.string().nullable(),
  sources: z.array(SourceSchema).default([]),
});
export type AskAnswer = z.infer<typeof AskAnswerSchema>;
