import "server-only";

import { demoObservationsFor, demoJourneyFor } from "@/data/demo-journey";
import {
  analyzeImages,
  composeJourney,
  groundPlaceFact,
  isAiConfigured,
  normalizeKey,
  resolvePlaceDirect,
  resolvePlaces,
  type InlineImage,
} from "@/lib/ai/gemini";
import {
  UNCERTAIN_THRESHOLD,
  type DetectedPlace,
  type GroundedFact,
  type ImageAnalysis,
  type ImageMetadata,
  type ImageObservation,
  type Journey,
  type JourneyDay,
  type JourneyStop,
  type PlaceDetails,
} from "@/lib/ai/schemas";
import {
  assignDays,
  displayTimeOf,
  groupIntoStops,
  sortChronologically,
  tripDates,
  type StopGroup,
} from "@/lib/chronology";

export type PipelineMode = "live" | "demo";

/* ------------------------------------------------------------------ */
/* Stage A — metadata first, then understand the photographs           */
/* ------------------------------------------------------------------ */

export type AnalysisOutcome = {
  mode: PipelineMode;
  analyses: ImageAnalysis[];
  detectedPlaces: DetectedPlace[];
  probableDestination: string | null;
  unplacedImageIds: string[];
  tripStartDate: string | null;
  tripEndDate: string | null;
  dayCount: number;
  /** How many photos arrived without any trustworthy capture time. */
  photosWithoutTimestamp: number;
};

export async function runAnalysis(input: {
  images: InlineImage[];
  metadata: ImageMetadata[];
  tripHint?: string | null;
}): Promise<AnalysisOutcome> {
  const imageIds = input.images.map((image) => image.imageId);
  const metadataById = new Map(input.metadata.map((entry) => [entry.imageId, entry]));

  const observations: ImageObservation[] = isAiConfigured()
    ? await runObservation(input.images, input.tripHint)
    : demoObservationsFor(
        imageIds.map((imageId) => ({
          imageId,
          latitude: metadataById.get(imageId)?.latitude ?? null,
          longitude: metadataById.get(imageId)?.longitude ?? null,
        })),
      );

  const mode: PipelineMode = isAiConfigured() ? "live" : "demo";

  // Join the model's observations back onto each photo's own metadata. The
  // metadata is the part that decides the journey's shape from here on.
  const byId = new Map(observations.map((observation) => [observation.imageId, observation]));
  const analyses: ImageAnalysis[] = imageIds.map((imageId, index) => ({
    ...(byId.get(imageId) ?? emptyObservation(imageId)),
    imageId,
    metadata: metadataById.get(imageId) ?? fallbackMetadata(imageId, index),
  }));

  return { mode, ...buildChronology(analyses), probableDestination: destinationOf(analyses) };
}

async function runObservation(images: InlineImage[], tripHint?: string | null): Promise<ImageObservation[]> {
  const result = await analyzeImages(images, tripHint);
  return result.images;
}

/**
 * The ordering pipeline, shared by the review step and the journey build so
 * the user cannot be shown one sequence and given another.
 */
function buildChronology(analyses: ImageAnalysis[]) {
  const ordered = sortChronologically(analyses);
  const dated = assignDays(ordered);
  const groups = groupIntoStops(dated);
  const { startDate, endDate, dayCount } = tripDates(groups);

  const detectedPlaces: DetectedPlace[] = groups.map((group) => ({
    id: group.id,
    name: group.placeName,
    city: group.city,
    imageIds: group.imageIds,
    confidence: group.confidence,
    uncertain: group.confidence < UNCERTAIN_THRESHOLD,
    capturedAt: group.capturedAt,
    displayTime: displayTimeOf(group.capturedAt),
    date: group.date,
    dayNumber: group.dayNumber,
    timeSource: group.timeSource,
  }));

  return {
    analyses: ordered,
    detectedPlaces,
    unplacedImageIds: ordered.filter((a) => !a.possiblePlace && !a.possibleLandmark).map((a) => a.imageId),
    tripStartDate: startDate,
    tripEndDate: endDate,
    dayCount,
    photosWithoutTimestamp: ordered.filter((a) => !a.metadata.hasReliableTimestamp).length,
  };
}

function destinationOf(analyses: ImageAnalysis[]): string | null {
  const cities = analyses.map((analysis) => analysis.city).filter((city): city is string => Boolean(city));
  if (cities.length === 0) return null;
  const counts = new Map<string, number>();
  for (const city of cities) counts.set(city, (counts.get(city) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function emptyObservation(imageId: string): ImageObservation {
  return {
    imageId,
    possiblePlace: null,
    possibleLandmark: null,
    city: null,
    visualDescription: "",
    heritageElements: [],
    visibleText: [],
    timeOfDay: "unknown",
    confidence: 0,
  };
}

function fallbackMetadata(imageId: string, uploadIndex: number): ImageMetadata {
  return {
    imageId,
    fileName: "",
    capturedAt: null,
    captureDate: null,
    captureTime: null,
    timezone: null,
    latitude: null,
    longitude: null,
    metadataSource: "upload_order",
    hasReliableTimestamp: false,
    uploadIndex,
  };
}

/* ------------------------------------------------------------------ */
/* Stage B — verify, ground, and write                                 */
/* ------------------------------------------------------------------ */

export type JourneyBuildInput = {
  journeyId: string;
  analyses: ImageAnalysis[];
  /** Stops the user kept (and possibly renamed) on the review screen. */
  places: Array<{ id: string; name: string; city: string | null; imageIds: string[] }>;
  tripName?: string | null;
  imageIds: string[];
};

export async function buildJourney(input: JourneyBuildInput): Promise<Journey> {
  // Re-derive the chronology from the metadata rather than trusting whatever
  // ordering arrived over the wire, then apply the user's review decisions.
  const chronology = buildChronology(input.analyses);
  const kept = new Set(input.places.map((place) => place.id));
  const renames = new Map(input.places.map((place) => [place.id, place.name.trim()]));

  const groups = groupsFrom(chronology, kept, renames);

  if (!isAiConfigured()) {
    return demoJourneyFor({
      id: input.journeyId,
      groups,
      tripName: input.tripName,
      totalPhotos: input.imageIds.length,
    });
  }

  const named = groups.filter((group) => group.placeName.length > 0);

  // 1. Function calling — resolve each named place to a real map location.
  let placeDetails = new Map<string, PlaceDetails>();
  try {
    placeDetails = await resolvePlaces(named.map((group) => ({ name: group.placeName, city: group.city })));
  } catch (error) {
    console.error("[pipeline] place resolution failed:", error);
  }

  await Promise.all(
    named.map(async (group) => {
      if (placeDetails.has(normalizeKey(group.placeName))) return;
      try {
        const details = await resolvePlaceDirect(group.placeName, group.city);
        if (details) placeDetails.set(normalizeKey(group.placeName), details);
      } catch (error) {
        console.error("[pipeline] direct place lookup failed:", group.placeName, error);
      }
    }),
  );

  // 2. Google Search grounding — one verified fact per distinct place.
  const facts = new Map<string, GroundedFact>();
  const distinct = [...new Map(named.map((group) => [normalizeKey(group.placeName), group])).values()];
  const grounded = await Promise.all(
    distinct.map(async (group) => {
      try {
        return await groundPlaceFact(group.placeName, group.city);
      } catch (error) {
        console.error("[pipeline] grounding failed:", group.placeName, error);
        return null;
      }
    }),
  );
  grounded.forEach((fact, index) => {
    if (fact?.verified) facts.set(normalizeKey(distinct[index].placeName), fact);
  });

  // 3. Structured output — narrative only, over a stop list that is already
  //    ordered and grouped. The model is not asked for sequence.
  const draft = await composeJourney(buildCompositionPayload(groups, placeDetails), input.tripName);
  const written = new Map(draft.stops.map((stop) => [stop.stopId, stop]));

  const stops: JourneyStop[] = groups.map((group, index) => {
    const key = normalizeKey(group.placeName);
    const details = group.placeName ? placeDetails.get(key) : undefined;
    const fact = group.placeName ? facts.get(key) : undefined;
    const text = written.get(group.id);

    return {
      id: group.id,
      order: index + 1,
      imageIds: group.imageIds,
      placeName: details?.name || group.placeName,
      location: details?.formattedAddress || group.city || "",
      title: text?.title ?? "",
      narrative: text?.narrative ?? "",
      verifiedFact: fact?.fact || null,
      sources: fact?.sources ?? [],
      coordinates: coordinatesFor(group, details),
      googleMapsUrl: details?.googleMapsUrl ?? mapsUrlFor(group),
      confidence: group.confidence,
      capturedAt: group.capturedAt,
      endedAt: group.endedAt,
      displayTime: displayTimeOf(group.capturedAt),
      date: group.date,
      dayNumber: group.dayNumber,
      timeSource: group.timeSource,
    };
  });

  const { startDate, endDate } = tripDates(groups);

  return {
    id: input.journeyId,
    title: draft.title || input.tripName || "رحلتي",
    destination: draft.destination || "",
    date: startDate,
    endDate,
    days: daysFrom(stops),
    coverImageId: stops.find((stop) => stop.imageIds.length > 0)?.imageIds[0] ?? input.imageIds[0] ?? null,
    shortIntro: draft.shortIntro,
    stops,
    summary: {
      numberOfPhotos: stops.reduce((total, stop) => total + stop.imageIds.length, 0),
      numberOfPlaces: new Set(stops.map((stop) => stop.placeName).filter(Boolean)).size || stops.length,
      majorLandmarks:
        draft.majorLandmarks.length > 0
          ? draft.majorLandmarks
          : [...new Set(stops.map((stop) => stop.placeName).filter(Boolean))],
      discoveredFactsCount: stops.filter((stop) => stop.verifiedFact).length,
      closingText: draft.closingText,
    },
    mapLocations: stops
      .filter((stop) => stop.coordinates)
      .map((stop) => ({ stopId: stop.id, label: stop.placeName || stop.title, coordinates: stop.coordinates! })),
    createdAt: new Date().toISOString(),
    mode: "live",
  };
}

/**
 * Applies the review screen's decisions to the computed groups: drop removed
 * stops, take renames. Order is never taken from the request — removing a stop
 * cannot reshuffle the rest.
 */
function groupsFrom(
  chronology: ReturnType<typeof buildChronology>,
  kept: Set<string>,
  renames: Map<string, string>,
): StopGroup[] {
  const dated = assignDays(chronology.analyses);
  return groupIntoStops(dated)
    .filter((group) => kept.has(group.id))
    .map((group) => ({ ...group, placeName: renames.get(group.id) ?? group.placeName }));
}

function daysFrom(stops: JourneyStop[]): JourneyDay[] {
  const days = new Map<number, JourneyDay>();
  for (const stop of stops) {
    const existing = days.get(stop.dayNumber);
    if (existing) existing.stopIds.push(stop.id);
    else days.set(stop.dayNumber, { dayNumber: stop.dayNumber, date: stop.date, stopIds: [stop.id] });
  }
  return [...days.values()].sort((a, b) => a.dayNumber - b.dayNumber);
}

/** Prefers the photo's own GPS over a name lookup — it is the stronger evidence. */
function coordinatesFor(group: StopGroup, details?: PlaceDetails) {
  if (group.latitude !== null && group.longitude !== null) {
    return { lat: group.latitude, lng: group.longitude };
  }
  if (details?.latitude != null && details?.longitude != null) {
    return { lat: details.latitude, lng: details.longitude };
  }
  return null;
}

function mapsUrlFor(group: StopGroup): string | null {
  if (group.latitude === null || group.longitude === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${group.latitude},${group.longitude}`;
}

function buildCompositionPayload(groups: StopGroup[], details: Map<string, PlaceDetails>): string {
  const lines: string[] = [
    "The stops below are ALREADY in chronological order, established from the",
    "photographs' own capture timestamps. Write about them in exactly this order.",
    "",
  ];

  let currentDay = 0;
  for (const group of groups) {
    if (group.dayNumber !== currentDay) {
      currentDay = group.dayNumber;
      lines.push(`--- DAY ${currentDay}${group.date ? ` (${group.date})` : ""} ---`);
    }

    const resolved = details.get(normalizeKey(group.placeName));
    const time = group.capturedAt ? group.capturedAt.slice(11, 16) : "time unknown";
    const span =
      group.endedAt && group.endedAt !== group.capturedAt ? `–${group.endedAt.slice(11, 16)}` : "";

    lines.push(
      `stopId: ${group.id}`,
      `  time: ${time}${span}`,
      `  place: ${resolved?.name || group.placeName || "UNIDENTIFIED — do not name it, write around it"}${
        group.city ? ` (${group.city})` : ""
      }`,
      `  photos: ${group.analyses.length}`,
    );

    for (const analysis of group.analyses) {
      lines.push(
        `    - ${analysis.metadata.capturedAt?.slice(11, 16) ?? "??:??"} | ${analysis.visualDescription}${
          analysis.heritageElements.length ? ` | عناصر: ${analysis.heritageElements.join("، ")}` : ""
        }`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
