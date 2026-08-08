import { z } from "zod";

/**
 * Every structured payload that crosses an AI boundary is validated here.
 * Gemini responses are parsed with these schemas before they are allowed
 * anywhere near the UI — a malformed model response degrades gracefully
 * instead of rendering broken journeys.
 */

/* ------------------------------------------------------------------ */
/* Stage 1 — multimodal image understanding                            */
/* ------------------------------------------------------------------ */

export const ImageAnalysisSchema = z.object({
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
export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

export const AnalysisResultSchema = z.object({
  images: z.array(ImageAnalysisSchema),
  probableDestination: z.string().nullable(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

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
});
export type JourneyStop = z.infer<typeof JourneyStopSchema>;

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
  date: z.string().nullable(),
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
 * What Gemini is asked to return for the journey composition step —
 * ids, coordinates and sources are attached by our own code afterwards,
 * so the model is never asked to invent a URL or a lat/lng.
 */
export const JourneyDraftSchema = z.object({
  title: z.string(),
  destination: z.string(),
  shortIntro: z.string(),
  stops: z.array(
    z.object({
      placeName: z.string(),
      location: z.string(),
      title: z.string(),
      narrative: z.string(),
      imageIds: z.array(z.string()).default([]),
    }),
  ),
  closingText: z.string(),
  majorLandmarks: z.array(z.string()).default([]),
});
export type JourneyDraft = z.infer<typeof JourneyDraftSchema>;

/* ------------------------------------------------------------------ */
/* Review step + Ask-about-my-trip                                     */
/* ------------------------------------------------------------------ */

export const DetectedPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  imageIds: z.array(z.string()),
  confidence: z.number(),
  uncertain: z.boolean(),
});
export type DetectedPlace = z.infer<typeof DetectedPlaceSchema>;

export const AskAnswerSchema = z.object({
  answer: z.string(),
  relatedStopId: z.string().nullable(),
  sources: z.array(SourceSchema).default([]),
});
export type AskAnswer = z.infer<typeof AskAnswerSchema>;
