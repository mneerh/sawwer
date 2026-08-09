import { NextResponse } from "next/server";
import { z } from "zod";

import { answerLocally } from "@/lib/ai/demo-answers";
import { askAboutJourney, isAiConfigured } from "@/lib/ai/gemini";
import { JourneySchema, type Journey } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  question: z.string().min(1).max(500),
  journey: JourneySchema,
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

  const { question, journey } = parsed.data;

  if (!isAiConfigured()) {
    return NextResponse.json({ ...answerLocally(question, journey), mode: "demo" });
  }

  try {
    const answer = await askAboutJourney(question, serializeJourney(journey));
    const stop = journey.stops.find((candidate) => candidate.id === answer.relatedStopId);
    return NextResponse.json({
      ...answer,
      // Citations are taken from the stop we already verified, not from the model.
      sources: stop?.sources ?? [],
      mode: "live",
    });
  } catch (error) {
    console.error("[api/ask]", error);
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}

/** Flattens a journey into the compact context the model answers from. */
function serializeJourney(journey: Journey): string {
  const lines = [
    `TITLE: ${journey.title}`,
    `DESTINATION: ${journey.destination}`,
    journey.date ? `DATE: ${journey.date}${journey.endDate && journey.endDate !== journey.date ? ` to ${journey.endDate}` : ""}` : "",
    `INTRO: ${journey.shortIntro}`,
    "",
    "STOPS (in order, times read from the photographs' own metadata):",
  ].filter(Boolean);

  for (const stop of journey.stops) {
    lines.push(
      `[${stop.id}] #${stop.order} ${stop.placeName || "unidentified place"} — ${stop.location}`,
      `  day: ${stop.dayNumber}${stop.date ? ` (${stop.date})` : ""}`,
      `  time: ${stop.displayTime ?? "unknown — the photo carried no timestamp, do not guess one"}`,
      `  title: ${stop.title}`,
      `  narrative: ${stop.narrative}`,
      `  verifiedFact: ${stop.verifiedFact ?? "none"}`,
      `  photos: ${stop.imageIds.length}`,
    );
  }

  lines.push(
    "",
    `SUMMARY: ${journey.summary.numberOfPhotos} photos, ${journey.summary.numberOfPlaces} places, ${journey.summary.discoveredFactsCount} verified facts.`,
    `CLOSING: ${journey.summary.closingText}`,
  );

  return lines.join("\n");
}
