import type { ImageAnalysis, ImageMetadata, MetadataSource } from "@/lib/ai/schemas";

/**
 * The journey's spine.
 *
 * Everything here is pure and deterministic: photo metadata in, ordered and
 * grouped stops out. The model is never consulted about sequence — by the time
 * Gemini writes a single word, the order is already fixed and cannot be changed
 * by anything it returns.
 */

/* ------------------------------------------------------------------ */
/* time helpers — wall clock only, never UTC instants                  */
/* ------------------------------------------------------------------ */

/**
 * Turns "YYYY-MM-DDTHH:mm:ss" into a comparable number.
 *
 * Date.UTC is used purely as a calendar calculator: every timestamp goes
 * through the same transform, so differences and ordering are exact. No value
 * produced here is ever displayed or treated as a real UTC instant.
 */
export function wallClockValue(capturedAt: string | null): number | null {
  if (!capturedAt) return null;
  const match = capturedAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  );
}

/** "HH:mm" for storage. The UI localises this per locale. */
export function displayTimeOf(capturedAt: string | null): string | null {
  if (!capturedAt) return null;
  const match = capturedAt.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function dateOf(capturedAt: string | null): string | null {
  if (!capturedAt) return null;
  return capturedAt.slice(0, 10);
}

const SOURCE_RANK: Record<MetadataSource, number> = {
  exif_datetime_original: 3,
  exif_create_date: 2,
  file_metadata: 1,
  upload_order: 0,
};

function bestSource(sources: MetadataSource[]): MetadataSource {
  return sources.reduce((best, current) => (SOURCE_RANK[current] > SOURCE_RANK[best] ? current : best), "upload_order");
}

/* ------------------------------------------------------------------ */
/* 1. chronological ordering                                           */
/* ------------------------------------------------------------------ */

/**
 * Orders photos by their original capture time.
 *
 * Photos with no usable timestamp are *anchored*: each one inherits the sort
 * position of the nearest preceding timestamped photo in upload order (or the
 * earliest one, if it leads the selection). That keeps an untimed photo beside
 * the photos it was uploaded with instead of dumping every unknown at the end —
 * and crucially, it never writes a timestamp onto a photo that has none.
 * `capturedAt` stays null all the way to the UI, which renders "الوقت غير متوفر".
 */
export function sortChronologically(analyses: ImageAnalysis[]): ImageAnalysis[] {
  const byUpload = [...analyses].sort((a, b) => a.metadata.uploadIndex - b.metadata.uploadIndex);

  const values = byUpload.map((analysis) => wallClockValue(analysis.metadata.capturedAt));

  // Forward pass: inherit the last known timestamp.
  const anchors: Array<number | null> = [];
  let previous: number | null = null;
  for (const value of values) {
    if (value !== null) previous = value;
    anchors.push(value ?? previous);
  }

  // Backward pass: anything before the first timestamp sorts just ahead of it.
  const firstKnown = values.find((value) => value !== null) ?? null;
  for (let index = 0; index < anchors.length; index++) {
    if (anchors[index] === null) anchors[index] = firstKnown === null ? 0 : firstKnown - 1;
  }

  return byUpload
    .map((analysis, index) => ({ analysis, anchor: anchors[index] as number }))
    .sort((a, b) => a.anchor - b.anchor || a.analysis.metadata.uploadIndex - b.analysis.metadata.uploadIndex)
    .map((entry) => entry.analysis);
}

/* ------------------------------------------------------------------ */
/* 2. day assignment                                                   */
/* ------------------------------------------------------------------ */

export type DatedAnalysis = ImageAnalysis & { dayNumber: number; dayDate: string | null };

/**
 * Splits an ordered run of photos into trip days by capture date. Photos with
 * no date at all inherit the day of the nearest preceding dated photo, so an
 * untimed shot doesn't spawn a phantom day.
 */
export function assignDays(ordered: ImageAnalysis[]): DatedAnalysis[] {
  const dates: Array<string | null> = ordered.map(
    (analysis) => analysis.metadata.captureDate ?? dateOf(analysis.metadata.capturedAt),
  );

  let carried: string | null = dates.find((date) => date !== null) ?? null;
  const resolved = dates.map((date) => {
    if (date !== null) carried = date;
    return carried;
  });

  const uniqueDates = [...new Set(resolved.filter((date): date is string => date !== null))].sort();
  const dayIndex = new Map(uniqueDates.map((date, index) => [date, index + 1]));

  return ordered.map((analysis, index) => ({
    ...analysis,
    dayNumber: resolved[index] ? (dayIndex.get(resolved[index]!) ?? 1) : 1,
    dayDate: resolved[index],
  }));
}

/* ------------------------------------------------------------------ */
/* 3. grouping into stops                                              */
/* ------------------------------------------------------------------ */

/** Same place, but hours later, is a second visit — and a second stop. */
const SAME_PLACE_MAX_GAP_MINUTES = 90;
/** How close in time an unidentified photo has to be to join its neighbour. */
const NEARBY_MAX_GAP_MINUTES = 20;
/** Beyond this the camera physically moved, whatever the model thinks. */
const GPS_MAX_METERS = 300;

export type StopGroup = {
  id: string;
  placeName: string;
  city: string | null;
  imageIds: string[];
  analyses: DatedAnalysis[];
  capturedAt: string | null;
  endedAt: string | null;
  date: string | null;
  dayNumber: number;
  confidence: number;
  timeSource: MetadataSource;
  latitude: number | null;
  longitude: number | null;
};

/**
 * Collapses consecutive photos of the same place and moment into one stop.
 *
 * This only ever merges *adjacent* photos in the already-sorted run, which is
 * what makes it safe: grouping can never move a photo past another one, so the
 * chronology established from the timestamps survives untouched.
 */
export function groupIntoStops(ordered: DatedAnalysis[]): StopGroup[] {
  const groups: DatedAnalysis[][] = [];

  for (const analysis of ordered) {
    const current = groups[groups.length - 1];
    if (current && belongsTogether(current[current.length - 1], analysis)) current.push(analysis);
    else groups.push([analysis]);
  }

  return groups.map((members, index) => toStopGroup(members, index));
}

function belongsTogether(previous: DatedAnalysis, next: DatedAnalysis): boolean {
  if (previous.dayNumber !== next.dayNumber) return false;

  const metres = distanceInMetres(previous.metadata, next.metadata);
  if (metres !== null && metres > GPS_MAX_METERS) return false;

  const gap = gapInMinutes(previous.metadata, next.metadata);

  const placeA = normalizePlace(previous);
  const placeB = normalizePlace(next);

  if (placeA && placeB) {
    if (placeA !== placeB) return false;
    return gap === null || gap <= SAME_PLACE_MAX_GAP_MINUTES;
  }

  // At least one photo has no identified place — lean on time and GPS instead.
  if (gap === null) {
    // No usable times: only merge when GPS actively says they are together.
    return metres !== null && metres <= GPS_MAX_METERS;
  }
  return gap <= NEARBY_MAX_GAP_MINUTES;
}

function toStopGroup(members: DatedAnalysis[], index: number): StopGroup {
  const times = members
    .map((member) => member.metadata.capturedAt)
    .filter((value): value is string => value !== null)
    .sort();

  const named = members.filter((member) => normalizePlace(member));
  // The most confident identification in the group names the stop.
  const primary = named.sort((a, b) => b.confidence - a.confidence)[0];

  const withGps = members.find((member) => member.metadata.latitude !== null);

  return {
    id: `stop-${index + 1}`,
    placeName: primary ? (primary.possiblePlace || primary.possibleLandmark || "").trim() : "",
    city: members.find((member) => member.city)?.city ?? null,
    imageIds: members.map((member) => member.imageId),
    analyses: members,
    capturedAt: times[0] ?? null,
    endedAt: times.length > 1 ? times[times.length - 1] : (times[0] ?? null),
    date: members.find((member) => member.dayDate)?.dayDate ?? null,
    dayNumber: members[0].dayNumber,
    confidence: Math.max(...members.map((member) => member.confidence), 0),
    timeSource: bestSource(members.map((member) => member.metadata.metadataSource)),
    latitude: withGps?.metadata.latitude ?? null,
    longitude: withGps?.metadata.longitude ?? null,
  };
}

function normalizePlace(analysis: ImageAnalysis): string | null {
  const raw = analysis.possiblePlace || analysis.possibleLandmark;
  if (!raw) return null;
  const trimmed = raw
    .trim()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function gapInMinutes(a: ImageMetadata, b: ImageMetadata): number | null {
  const first = wallClockValue(a.capturedAt);
  const second = wallClockValue(b.capturedAt);
  if (first === null || second === null) return null;
  return Math.abs(second - first) / 60000;
}

function distanceInMetres(a: ImageMetadata, b: ImageMetadata): number | null {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) return null;

  const R = 6371000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ------------------------------------------------------------------ */
/* 4. trip-level summary                                               */
/* ------------------------------------------------------------------ */

export type TripDates = { startDate: string | null; endDate: string | null; dayCount: number };

export function tripDates(groups: StopGroup[]): TripDates {
  const dates = [...new Set(groups.map((group) => group.date).filter((date): date is string => date !== null))].sort();
  return {
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null,
    dayCount: Math.max(1, dates.length),
  };
}
