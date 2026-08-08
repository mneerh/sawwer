import "server-only";

import { demoAnalysisFor, demoJourneyFor } from "@/data/demo-journey";
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
  type Journey,
  type JourneyStop,
  type MapLocation,
  type PlaceDetails,
} from "@/lib/ai/schemas";

export type PipelineMode = "live" | "demo";

/* ------------------------------------------------------------------ */
/* Stage A — understand the photographs                                */
/* ------------------------------------------------------------------ */

export type AnalysisOutcome = {
  mode: PipelineMode;
  analyses: ImageAnalysis[];
  detectedPlaces: DetectedPlace[];
  probableDestination: string | null;
  unplacedImageIds: string[];
};

export async function runAnalysis(input: {
  images: InlineImage[];
  tripHint?: string | null;
}): Promise<AnalysisOutcome> {
  const imageIds = input.images.map((image) => image.imageId);

  if (!isAiConfigured()) {
    const analyses = demoAnalysisFor(imageIds);
    return { mode: "demo", ...summarizeAnalyses(analyses) };
  }

  const result = await analyzeImages(input.images, input.tripHint);

  // The model returns one object per image, but never trust the count —
  // backfill anything missing so the review screen stays consistent.
  const byId = new Map(result.images.map((analysis) => [analysis.imageId, analysis]));
  const analyses: ImageAnalysis[] = imageIds.map(
    (imageId) =>
      byId.get(imageId) ?? {
        imageId,
        possiblePlace: null,
        possibleLandmark: null,
        city: null,
        visualDescription: "",
        heritageElements: [],
        visibleText: [],
        timeOfDay: "unknown" as const,
        confidence: 0,
      },
  );

  return {
    mode: "live",
    ...summarizeAnalyses(analyses),
    probableDestination: result.probableDestination ?? summarizeAnalyses(analyses).probableDestination,
  };
}

function summarizeAnalyses(analyses: ImageAnalysis[]): Omit<AnalysisOutcome, "mode"> {
  const groups = new Map<string, DetectedPlace>();
  const unplacedImageIds: string[] = [];

  for (const analysis of analyses) {
    const name = analysis.possiblePlace || analysis.possibleLandmark;
    if (!name) {
      unplacedImageIds.push(analysis.imageId);
      continue;
    }

    const key = normalizeKey(name);
    const existing = groups.get(key);
    if (existing) {
      existing.imageIds.push(analysis.imageId);
      // Keep the strongest evidence we saw for this place.
      existing.confidence = Math.max(existing.confidence, analysis.confidence);
      existing.uncertain = existing.confidence < UNCERTAIN_THRESHOLD;
    } else {
      groups.set(key, {
        id: `place-${groups.size + 1}`,
        name,
        city: analysis.city,
        imageIds: [analysis.imageId],
        confidence: analysis.confidence,
        uncertain: analysis.confidence < UNCERTAIN_THRESHOLD,
      });
    }
  }

  const detectedPlaces = [...groups.values()];
  const cities = detectedPlaces.map((place) => place.city).filter((city): city is string => Boolean(city));

  return {
    analyses,
    detectedPlaces,
    probableDestination: mostCommon(cities),
    unplacedImageIds,
  };
}

/* ------------------------------------------------------------------ */
/* Stage B — verify, ground, and compose                               */
/* ------------------------------------------------------------------ */

export type JourneyBuildInput = {
  journeyId: string;
  analyses: ImageAnalysis[];
  /** Places the user kept (and possibly renamed) on the review screen. */
  places: Array<{ id: string; name: string; city: string | null; imageIds: string[] }>;
  tripName?: string | null;
  imageIds: string[];
};

export async function buildJourney(input: JourneyBuildInput): Promise<Journey> {
  if (!isAiConfigured()) {
    return demoJourneyFor({
      id: input.journeyId,
      imageIds: input.imageIds,
      tripName: input.tripName,
    });
  }

  const places = input.places.filter((place) => place.name.trim().length > 0);

  // 1. Function calling — let Gemini resolve each place to a real map location.
  let placeDetails = new Map<string, PlaceDetails>();
  try {
    placeDetails = await resolvePlaces(places.map((place) => ({ name: place.name, city: place.city })));
  } catch (error) {
    console.error("[pipeline] place resolution failed:", error);
  }

  // Anything the tool loop missed, resolve directly rather than dropping the pin.
  await Promise.all(
    places.map(async (place) => {
      if (placeDetails.has(normalizeKey(place.name))) return;
      try {
        const details = await resolvePlaceDirect(place.name, place.city);
        if (details) placeDetails.set(normalizeKey(place.name), details);
      } catch (error) {
        console.error("[pipeline] direct place lookup failed:", place.name, error);
      }
    }),
  );

  // 2. Google Search grounding — one verified fact per place.
  const facts = new Map<string, GroundedFact>();
  const grounded = await Promise.all(
    places.map(async (place) => {
      try {
        return await groundPlaceFact(place.name, place.city);
      } catch (error) {
        console.error("[pipeline] grounding failed:", place.name, error);
        return null;
      }
    }),
  );
  grounded.forEach((fact, index) => {
    if (fact?.verified) facts.set(normalizeKey(places[index].name), fact);
  });

  // 3. Structured output — the narrative itself.
  const draft = await composeJourney(
    buildCompositionPayload(input.analyses, places, placeDetails),
    input.tripName,
  );

  // 4. Assemble. Ids, coordinates and citations come from our code, never
  //    from the model — so a hallucinated URL can't reach the page.
  const usedImages = new Set<string>();
  const stops: JourneyStop[] = draft.stops.map((stop, index) => {
    const key = normalizeKey(stop.placeName);
    const details = placeDetails.get(key);
    const fact = facts.get(key);
    const reviewed = places.find((place) => normalizeKey(place.name) === key);

    const imageIds = stop.imageIds.filter((imageId) => input.imageIds.includes(imageId) && !usedImages.has(imageId));
    imageIds.forEach((imageId) => usedImages.add(imageId));

    return {
      id: `stop-${index + 1}`,
      order: index + 1,
      imageIds,
      placeName: details?.name || stop.placeName,
      location: stop.location || details?.formattedAddress || "",
      title: stop.title,
      narrative: stop.narrative,
      verifiedFact: fact?.fact || null,
      sources: fact?.sources ?? [],
      coordinates:
        details?.latitude != null && details?.longitude != null
          ? { lat: details.latitude, lng: details.longitude }
          : null,
      googleMapsUrl: details?.googleMapsUrl ?? null,
      confidence: reviewed?.imageIds.length
        ? Math.max(...input.analyses.filter((a) => reviewed.imageIds.includes(a.imageId)).map((a) => a.confidence), 0)
        : 0.5,
    };
  });

  // Any photo the model forgot still belongs to the trip — attach it to the
  // closest stop so nothing the traveller uploaded silently disappears.
  const leftovers = input.imageIds.filter((imageId) => !usedImages.has(imageId));
  if (leftovers.length > 0 && stops.length > 0) {
    leftovers.forEach((imageId, index) => {
      stops[Math.min(stops.length - 1, Math.floor((index * stops.length) / leftovers.length))].imageIds.push(imageId);
    });
  }

  const mapLocations: MapLocation[] = stops
    .filter((stop) => stop.coordinates)
    .map((stop) => ({ stopId: stop.id, label: stop.placeName, coordinates: stop.coordinates! }));

  const coverStop = stops.find((stop) => stop.imageIds.length > 0);

  return {
    id: input.journeyId,
    title: draft.title || input.tripName || "رحلتي",
    destination: draft.destination || "",
    date: new Date().toISOString().slice(0, 10),
    coverImageId: coverStop?.imageIds[0] ?? input.imageIds[0] ?? null,
    shortIntro: draft.shortIntro,
    stops,
    summary: {
      numberOfPhotos: input.imageIds.length,
      numberOfPlaces: stops.length,
      majorLandmarks: draft.majorLandmarks.length > 0 ? draft.majorLandmarks : stops.map((stop) => stop.placeName),
      discoveredFactsCount: stops.filter((stop) => stop.verifiedFact).length,
      closingText: draft.closingText,
    },
    mapLocations,
    createdAt: new Date().toISOString(),
    mode: "live",
  };
}

function buildCompositionPayload(
  analyses: ImageAnalysis[],
  places: Array<{ name: string; city: string | null; imageIds: string[] }>,
  details: Map<string, PlaceDetails>,
): string {
  const lines: string[] = ["CONFIRMED STOPS:"];

  for (const place of places) {
    const resolved = details.get(normalizeKey(place.name));
    lines.push(
      `- ${resolved?.name || place.name}${place.city ? ` (${place.city})` : ""}${
        resolved?.formattedAddress ? ` — ${resolved.formattedAddress}` : ""
      }`,
    );
    lines.push(`  imageIds: ${place.imageIds.join(", ") || "none"}`);
  }

  lines.push("", "PHOTOGRAPH ANALYSES:");
  for (const analysis of analyses) {
    lines.push(
      `- ${analysis.imageId} | ${analysis.timeOfDay} | ${analysis.possiblePlace ?? "مكان غير محدد"} | ${
        analysis.visualDescription
      }${analysis.heritageElements.length ? ` | عناصر: ${analysis.heritageElements.join("، ")}` : ""}`,
    );
  }

  return lines.join("\n");
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
