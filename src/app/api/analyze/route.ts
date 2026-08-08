import { NextResponse } from "next/server";
import { z } from "zod";

import { runAnalysis } from "@/lib/ai/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  images: z
    .array(
      z.object({
        imageId: z.string().min(1),
        mimeType: z.string().min(1),
        data: z.string().min(1),
      }),
    )
    .min(1)
    .max(12),
  tripHint: z.string().max(200).nullable().optional(),
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
    const outcome = await runAnalysis({
      images: parsed.data.images,
      tripHint: parsed.data.tripHint ?? null,
    });
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("[api/analyze]", error);
    return NextResponse.json({ error: "analysis_failed", message: messageOf(error) }, { status: 502 });
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unexpected error";
}
