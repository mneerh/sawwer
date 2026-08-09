import { NextResponse } from "next/server";

import { isAiConfigured } from "@/lib/ai/gemini";
import { isPlacesConfigured } from "@/lib/google/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the client which capabilities are actually live, so the UI can be
 * honest about demo mode without ever seeing a key.
 */
export async function GET() {
  return NextResponse.json({
    ai: isAiConfigured(),
    places: isPlacesConfigured(),
    // The map is OpenStreetMap + Leaflet. It has no credential to report —
    // it works identically whether or not anything else is configured.
    map: "openstreetmap",
    demoMode: !isAiConfigured(),
  });
}
