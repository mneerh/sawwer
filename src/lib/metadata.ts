"use client";

import exifr from "exifr";

import type { ImageMetadata, MetadataSource } from "@/lib/ai/schemas";

/**
 * Photo metadata extraction — runs entirely in the browser, on the original
 * file, before anything is uploaded or re-encoded.
 *
 * Two reasons it has to happen here:
 *   1. Privacy — the timestamp and GPS are read on-device, and only the fields
 *      the journey actually needs are ever sent onward.
 *   2. Correctness — `prepareImage` re-encodes through a canvas, which strips
 *      EXIF completely. Metadata must be read from the File first or it is gone.
 *
 * Timestamps are kept as local wall-clock strings, never as UTC instants. EXIF
 * records no timezone, so 15:12 means "the camera's clock said 15:12" — the
 * time the traveller experienced. Converting that to UTC would invent an offset.
 */

/** EXIF tags we ask exifr for. Nothing else is read off the file. */
const PICKED_TAGS = [
  "DateTimeOriginal",
  "CreateDate",
  "DateTimeDigitized",
  "ModifyDate",
  "DateTime",
  "OffsetTimeOriginal",
  "OffsetTime",
  "GPSLatitude",
  "GPSLongitude",
  "GPSLatitudeRef",
  "GPSLongitudeRef",
] as const;

type ExifOutput = Record<string, unknown> & {
  latitude?: number;
  longitude?: number;
};

export async function extractMetadata(file: File, imageId: string, uploadIndex: number): Promise<ImageMetadata> {
  const base: ImageMetadata = {
    imageId,
    fileName: file.name,
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

  let exif: ExifOutput | null = null;
  try {
    exif = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      pick: [...PICKED_TAGS],
      // Dates are revived into Date objects built from local components, so
      // reading them back with local getters round-trips the wall clock exactly.
      reviveValues: true,
    })) as ExifOutput | null;
  } catch {
    // Not a JPEG, no EXIF segment, or a malformed one. Not an error — plenty of
    // images legitimately have no metadata, and the fallbacks handle it.
    exif = null;
  }

  const gps = readGps(exif);
  const timezone = readOffset(exif);

  // Priority 1–3: capture timestamps written by the camera.
  const candidates: Array<{ value: unknown; source: MetadataSource }> = [
    { value: exif?.DateTimeOriginal, source: "exif_datetime_original" },
    { value: exif?.CreateDate ?? exif?.DateTimeDigitized, source: "exif_create_date" },
    { value: exif?.ModifyDate ?? exif?.DateTime, source: "file_metadata" },
  ];

  for (const candidate of candidates) {
    const parsed = toWallClock(candidate.value);
    if (!parsed) continue;
    return {
      ...base,
      ...gps,
      timezone,
      capturedAt: parsed.capturedAt,
      captureDate: parsed.captureDate,
      captureTime: parsed.captureTime,
      metadataSource: candidate.source,
      hasReliableTimestamp: true,
    };
  }

  // Priority 4: a date encoded in the filename, but only when it is
  // unambiguous and plausible.
  const fromName = parseFileName(file.name);
  if (fromName) {
    return {
      ...base,
      ...gps,
      timezone,
      capturedAt: fromName.capturedAt,
      captureDate: fromName.captureDate,
      captureTime: fromName.captureTime,
      metadataSource: "file_metadata",
      // A date-only filename orders days but cannot order within a day.
      hasReliableTimestamp: fromName.capturedAt !== null,
    };
  }

  // Priority 5: upload order. Note what is deliberately NOT used here —
  // file.lastModified. That is when the file was copied or downloaded, not when
  // the photo was taken; trusting it would stamp a whole trip with the date the
  // user moved the files off their phone.
  return { ...base, ...gps, timezone };
}

export async function extractAllMetadata(files: File[], ids: string[]): Promise<ImageMetadata[]> {
  return Promise.all(files.map((file, index) => extractMetadata(file, ids[index], index)));
}

/* ------------------------------------------------------------------ */
/* parsing helpers                                                     */
/* ------------------------------------------------------------------ */

type WallClock = { capturedAt: string; captureDate: string; captureTime: string };

/**
 * Accepts what exifr may hand back: a Date (revived from local components) or
 * the raw "YYYY:MM:DD HH:mm:ss" string if revival failed.
 */
function toWallClock(value: unknown): WallClock | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return fromParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
    );
  }

  if (typeof value === "string") {
    const match = value
      .trim()
      .match(/^(\d{4})[:-](\d{2})[:-](\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    return fromParts(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? 0),
    );
  }

  return null;
}

function fromParts(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
): WallClock | null {
  if (!isPlausibleDate(year, month, day)) return null;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  const captureDate = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  const captureTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return { capturedAt: `${captureDate}T${captureTime}`, captureDate, captureTime };
}

/**
 * Cameras and phones with a dead clock love 1970 and 2000-01-01. A date outside
 * a sane window is worse than no date, because it would silently reorder a trip.
 */
function isPlausibleDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const now = new Date();
  // One day of slack for cameras a few hours ahead of the local clock.
  const upper = now.getFullYear() + (now.getMonth() === 11 && now.getDate() === 31 ? 1 : 0);
  return year >= 1990 && year <= upper;
}

/**
 * Common camera-roll filename conventions:
 *   IMG_20260718_151200 · PXL_20260718_151200123 · 20260718_151200
 *   2026-07-18 15.12.00 · 2026-07-18_15-12-00 · IMG_20260718
 * Anything less explicit is ignored rather than guessed at.
 */
function parseFileName(fileName: string): (WallClock | { capturedAt: null; captureDate: string; captureTime: null }) | null {
  const name = fileName.replace(/\.[^.]+$/, "");

  const withTime = name.match(/(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})[-_ T]+(\d{2})[-_.:]?(\d{2})[-_.:]?(\d{2})?/);
  if (withTime) {
    const parsed = fromParts(
      Number(withTime[1]),
      Number(withTime[2]),
      Number(withTime[3]),
      Number(withTime[4]),
      Number(withTime[5]),
      Number(withTime[6] ?? 0),
    );
    if (parsed) return parsed;
  }

  const dateOnly = name.match(/(?:^|[^\d])(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})(?:[^\d]|$)/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (isPlausibleDate(year, month, day)) {
      return { capturedAt: null, captureDate: `${pad(year, 4)}-${pad(month)}-${pad(day)}`, captureTime: null };
    }
  }

  return null;
}

function readGps(exif: ExifOutput | null): { latitude: number | null; longitude: number | null } {
  const latitude = typeof exif?.latitude === "number" ? exif.latitude : null;
  const longitude = typeof exif?.longitude === "number" ? exif.longitude : null;

  // 0,0 is the null island — almost always a zeroed GPS block, not the Gulf of Guinea.
  if (latitude === null || longitude === null) return { latitude: null, longitude: null };
  if (latitude === 0 && longitude === 0) return { latitude: null, longitude: null };
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { latitude: null, longitude: null };

  return { latitude, longitude };
}

function readOffset(exif: ExifOutput | null): string | null {
  const raw = exif?.OffsetTimeOriginal ?? exif?.OffsetTime;
  if (typeof raw !== "string") return null;
  return /^[+-]\d{2}:\d{2}$/.test(raw.trim()) ? raw.trim() : null;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}
