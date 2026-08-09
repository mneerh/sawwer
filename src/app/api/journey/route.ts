import { NextResponse } from "next/server";
import { z } from "zod";

import { buildJourney } from "@/lib/ai/pipeline";
import { ImageAnalysisSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

const RequestSchema = z.object({
  journeyId: z.string().min(1),
  analyses: z.array(ImageAnalysisSchema),
  places: z
    .array(
      z.object({
        id: z.string(),
        // May be empty: a stop can be a real moment at an unidentified place.
        name: z.string().max(120),
        city: z.string().max(120).nullable(),
        imageIds: z.array(z.string()),
      }),
    )
    .min(1)
    .max(12),
  tripName: z.string().max(120).nullable().optional(),
  imageIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const journey = await buildJourney({
      journeyId: parsed.data.journeyId,
      analyses: parsed.data.analyses,
      places: parsed.data.places,
      tripName: parsed.data.tripName ?? null,
      imageIds: parsed.data.imageIds,
    });
    return NextResponse.json({ journey });
  } catch (error) {
    console.error("[api/journey]", error);
    return NextResponse.json({ error: "journey_failed", message: messageOf(error) }, { status: 502 });
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unexpected error";
}
