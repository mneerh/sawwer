import "server-only";

import type { PlaceDetails } from "@/lib/ai/schemas";

/**
 * Place resolution, behind one function so the rest of the app never needs to
 * know whether a real Google key is present.
 *
 * Order of preference:
 *   1. Google Places API (Text Search, v1) — when a key is configured.
 *   2. A small offline gazetteer of Saudi heritage sites, so the demo has real
 *      coordinates instead of invented ones.
 *   3. null — the caller then renders the stop without a map pin.
 */

export function isPlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
}

export async function getPlaceDetails(placeName: string, city: string | null): Promise<PlaceDetails | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (key) {
    try {
      const remote = await textSearch(placeName, city, key);
      if (remote) return remote;
    } catch (error) {
      // A failing Places call must never take the journey down with it.
      console.error("[places] text search failed:", error);
    }
  }

  return lookupGazetteer(placeName, city);
}

async function textSearch(placeName: string, city: string | null, key: string): Promise<PlaceDetails | null> {
  const query = [placeName, city, "Saudi Arabia"].filter(Boolean).join(", ");

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "ar", maxResultCount: 1 }),
    // Places results for heritage sites are stable; cache to keep demos fast.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    console.error("[places] HTTP", response.status, await response.text().catch(() => ""));
    return null;
  }

  const data = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      googleMapsUri?: string;
    }>;
  };

  const place = data.places?.[0];
  if (!place) return null;

  return {
    name: place.displayName?.text || placeName,
    formattedAddress: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    placeId: place.id ?? null,
    source: "google-places",
  };
}

/* ------------------------------------------------------------------ */
/* Offline gazetteer                                                   */
/* ------------------------------------------------------------------ */

type GazetteerEntry = {
  name: string;
  aliases: string[];
  city: string;
  lat: number;
  lng: number;
};

/**
 * Coordinates for well-known Saudi heritage sites, so map pins are real even
 * with no Google key configured. Kept deliberately small — this is a fallback,
 * not a database.
 */
const GAZETTEER: GazetteerEntry[] = [
  { name: "حي الطريف", aliases: ["الطريف", "at-turaif", "at turaif", "turaif"], city: "الدرعية", lat: 24.7337, lng: 46.5726 },
  { name: "قصر سلوى", aliases: ["سلوى", "salwa palace", "salwa"], city: "الدرعية", lat: 24.7341, lng: 46.5719 },
  { name: "البجيري", aliases: ["حي البجيري", "bujairi", "bujairi terrace"], city: "الدرعية", lat: 24.7362, lng: 46.5766 },
  { name: "وادي حنيفة", aliases: ["wadi hanifah", "hanifa"], city: "الرياض", lat: 24.7215, lng: 46.5866 },
  { name: "مسجد الإمام محمد بن عبدالوهاب", aliases: ["مسجد الامام محمد بن عبدالوهاب"], city: "الدرعية", lat: 24.7357, lng: 46.5772 },
  { name: "الحجر", aliases: ["مدائن صالح", "hegra", "madain saleh"], city: "العلا", lat: 26.7917, lng: 37.9542 },
  { name: "البلدة القديمة بالعلا", aliases: ["العلا القديمة", "alula old town", "old town"], city: "العلا", lat: 26.6178, lng: 37.9186 },
  { name: "جبل الفيل", aliases: ["elephant rock"], city: "العلا", lat: 26.7167, lng: 38.0167 },
  { name: "مرايا", aliases: ["maraya"], city: "العلا", lat: 26.6444, lng: 37.9714 },
  { name: "جدة التاريخية", aliases: ["البلد", "al balad", "historic jeddah"], city: "جدة", lat: 21.4839, lng: 39.1866 },
  { name: "بيت نصيف", aliases: ["nassif house"], city: "جدة", lat: 21.4842, lng: 39.1875 },
  { name: "قصر المصمك", aliases: ["المصمك", "masmak"], city: "الرياض", lat: 24.6311, lng: 46.7136 },
  { name: "سوق الزل", aliases: ["souq al zal"], city: "الرياض", lat: 24.6297, lng: 46.7128 },
  { name: "جبل طويق", aliases: ["tuwaiq"], city: "الرياض", lat: 24.6, lng: 46.35 },
  { name: "رجال ألمع", aliases: ["رجال المع", "rijal almaa"], city: "عسير", lat: 18.1953, lng: 42.2833 },
  { name: "قرية ذي عين", aliases: ["ذي عين", "dhee ayn"], city: "الباحة", lat: 19.9333, lng: 41.4167 },
];

export function lookupGazetteer(placeName: string, city?: string | null): PlaceDetails | null {
  const needle = normalize(placeName);
  if (!needle) return null;

  // A city hint only ever narrows the search; if it matches nothing we fall
  // back to the whole gazetteer rather than returning empty-handed.
  const cityNeedle = city ? normalize(city) : null;
  const inCity = cityNeedle ? GAZETTEER.filter((candidate) => normalize(candidate.city) === cityNeedle) : [];
  const pool = inCity.length > 0 ? [...inCity, ...GAZETTEER] : GAZETTEER;

  const entry =
    pool.find((candidate) => normalize(candidate.name) === needle) ??
    pool.find((candidate) => candidate.aliases.some((alias) => normalize(alias) === needle)) ??
    pool.find((candidate) => {
      const name = normalize(candidate.name);
      return name.includes(needle) || needle.includes(name);
    }) ??
    pool.find((candidate) =>
      candidate.aliases.some((alias) => {
        const normalized = normalize(alias);
        return normalized.length > 3 && (needle.includes(normalized) || normalized.includes(needle));
      }),
    );

  if (!entry) return null;

  return {
    name: entry.name,
    formattedAddress: `${entry.city}، المملكة العربية السعودية`,
    latitude: entry.lat,
    longitude: entry.lng,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${entry.lat},${entry.lng}`,
    placeId: null,
    source: "gazetteer",
  };
}

function normalize(value: string): string {
  return value
    .trim()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
