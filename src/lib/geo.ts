import type { Coordinates } from "@/lib/ai/schemas";

/** Provider-agnostic geometry helpers used by the journey map. */

export function centerOf(points: Coordinates[]): Coordinates {
  if (points.length === 0) return { lat: 24.7337, lng: 46.5726 }; // Diriyah
  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
  return { lat, lng };
}

export function boundsOf(points: Coordinates[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/** Rejects the zeroed-GPS "null island" and anything outside real lat/lng range. */
export function isUsableCoordinate(coordinates: Coordinates | null | undefined): coordinates is Coordinates {
  if (!coordinates) return false;
  const { lat, lng } = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
