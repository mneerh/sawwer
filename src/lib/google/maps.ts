import type { Coordinates, MapLocation } from "@/lib/ai/schemas";

/**
 * Keyless deep links into Google Maps, for travellers who want directions on
 * their phone.
 *
 * The journey map itself is OpenStreetMap + Leaflet and needs no credentials —
 * these are plain URLs that require no API key, no SDK and no billing account.
 * Nothing here is on the rendering path; if you removed it the map would still
 * work.
 */

export function directionsUrl(locations: MapLocation[]): string | null {
  if (locations.length === 0) return null;
  if (locations.length === 1) return placeUrl(locations[0].coordinates);

  const origin = locations[0].coordinates;
  const destination = locations[locations.length - 1].coordinates;
  const waypoints = locations.slice(1, -1).map((location) => `${location.coordinates.lat},${location.coordinates.lng}`);

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
