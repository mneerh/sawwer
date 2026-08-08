"use client";

import { demoJourney, DEMO_JOURNEY_ID } from "@/data/demo-journey";
import { JourneySchema, type Journey } from "@/lib/ai/schemas";
import { get, getAll, IMAGE_STORE, JOURNEY_STORE, put, remove, removeByIndex } from "@/lib/storage/db";

/**
 * The MVP persistence layer: journeys and their photographs live in the
 * browser. Nothing leaves the device except the photos sent to Gemini during
 * generation. Swapping in a real backend means reimplementing this file.
 */

type StoredImage = {
  id: string;
  journeyId: string;
  blob: Blob;
  mimeType: string;
};

/* ------------------------------ journeys ------------------------------ */

export async function saveJourney(journey: Journey): Promise<void> {
  await put(JOURNEY_STORE, journey);
}

export async function getJourney(id: string): Promise<Journey | null> {
  if (id === DEMO_JOURNEY_ID) return demoJourney;

  try {
    const stored = await get<unknown>(JOURNEY_STORE, id);
    if (!stored) return null;
    const parsed = JourneySchema.safeParse(stored);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function listJourneys(): Promise<Journey[]> {
  let stored: Journey[] = [];
  try {
    const raw = await getAll<unknown>(JOURNEY_STORE);
    stored = raw
      .map((entry) => JourneySchema.safeParse(entry))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    stored = [];
  }

  stored.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // The sample Diriyah journey is always available to open.
  return [...stored, demoJourney];
}

export async function deleteJourney(id: string): Promise<void> {
  if (id === DEMO_JOURNEY_ID) return;
  await remove(JOURNEY_STORE, id);
  await removeByIndex(IMAGE_STORE, "journeyId", id);
}

/* ------------------------------- images ------------------------------- */

export async function saveImage(imageId: string, journeyId: string, blob: Blob): Promise<void> {
  await put<StoredImage>(IMAGE_STORE, { id: imageId, journeyId, blob, mimeType: blob.type });
}

const urlCache = new Map<string, string>();

/** Returns a blob: URL for a stored photo, or null when it isn't on this device. */
export async function getImageUrl(imageId: string): Promise<string | null> {
  const cached = urlCache.get(imageId);
  if (cached) return cached;

  try {
    const stored = await get<StoredImage>(IMAGE_STORE, imageId);
    if (!stored?.blob) return null;
    const url = URL.createObjectURL(stored.blob);
    urlCache.set(imageId, url);
    return url;
  } catch {
    return null;
  }
}

export function isDemoImage(imageId: string): boolean {
  return imageId.startsWith("demo-");
}
