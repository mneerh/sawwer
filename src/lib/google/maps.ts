import type { Coordinates, MapLocation } from "@/lib/ai/schemas";

/**
 * Maps stays behind this module so the journey page never branches on
 * "do we have a key". Without a key we render our own illustrated map;
 * deep links to Google Maps work either way, since they need no credentials.
 */

export function mapsEmbedUrl(locations: MapLocation[], apiKey: string): string | null {
  if (locations.length === 0) return null;
  const center = centerOf(locations.map((location) => location.coordinates));
  const params = new URLSearchParams({
    key: apiKey,
    q: `${center.lat},${center.lng}`,
    zoom: locations.length === 1 ? "15" : String(zoomFor(locations.map((l) => l.coordinates))),
    language: "ar",
    region: "SA",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

export function directionsUrl(locations: MapLocation[]): string | null {
  if (locations.length === 0) return null;
  if (locations.length === 1) return placeUrl(locations[0].coordinates);

  const origin = locations[0].coordinates;
  const destination = locations[locations.length - 1].coordinates;
  const waypoints = locations.slice(1, -1).map((l) => `${l.coordinates.lat},${l.coordinates.lng}`);

  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
  });
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function placeUrl(coordinates: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
}

export function centerOf(points: Coordinates[]): Coordinates {
  if (points.length === 0) return { lat: 24.7337, lng: 46.5726 };
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

export function boundsOf(points: Coordinates[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function zoomFor(points: Coordinates[]): number {
  if (points.length < 2) return 15;
  const { minLat, maxLat, minLng, maxLng } = boundsOf(points);
  const span = Math.max(maxLat - minLat, maxLng - minLng);
  if (span < 0.005) return 16;
  if (span < 0.02) return 14;
  if (span < 0.1) return 12;
  if (span < 0.5) return 10;
  if (span < 2) return 8;
  return 6;
}
