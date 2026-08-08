import "server-only";

import { GoogleGenAI, Type, FunctionCallingConfigMode, type Schema } from "@google/genai";

import { lookupGazetteer } from "@/lib/google/places";
import {
  ASK_SYSTEM,
  GROUNDING_SYSTEM,
  GROUNDING_USER,
  IMAGE_ANALYSIS_SYSTEM,
  IMAGE_ANALYSIS_USER,
  JOURNEY_COMPOSITION_SYSTEM,
  JOURNEY_COMPOSITION_USER,
  PLACE_RESOLUTION_SYSTEM,
} from "@/lib/ai/prompts";
import {
  AnalysisResultSchema,
  AskAnswerSchema,
  JourneyDraftSchema,
  PlaceDetailsSchema,
  type AnalysisResult,
  type AskAnswer,
  type GroundedFact,
  type JourneyDraft,
  type PlaceDetails,
  type Source,
} from "@/lib/ai/schemas";
import { getPlaceDetails } from "@/lib/google/places";

export const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

/** Gemini is optional — the whole product runs in demo mode without it. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function ai(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/* ------------------------------------------------------------------ */
/* Response schemas (Gemini's own Schema dialect)                       */
/* ------------------------------------------------------------------ */

const analysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    images: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          imageId: { type: Type.STRING },
          possiblePlace: { type: Type.STRING, nullable: true },
          possibleLandmark: { type: Type.STRING, nullable: true },
          city: { type: Type.STRING, nullable: true },
          visualDescription: { type: Type.STRING },
          heritageElements: { type: Type.ARRAY, items: { type: Type.STRING } },
          visibleText: { type: Type.ARRAY, items: { type: Type.STRING } },
          timeOfDay: {
            type: Type.STRING,
            enum: ["morning", "midday", "afternoon", "sunset", "night", "unknown"],
          },
          confidence: { type: Type.NUMBER },
        },
        required: ["imageId", "visualDescription", "heritageElements", "visibleText", "timeOfDay", "confidence"],
      },
    },
    probableDestination: { type: Type.STRING, nullable: true },
  },
  required: ["images"],
};

const journeyResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    destination: { type: Type.STRING },
    shortIntro: { type: Type.STRING },
    stops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          placeName: { type: Type.STRING },
          location: { type: Type.STRING },
          title: { type: Type.STRING },
          narrative: { type: Type.STRING },
          imageIds: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["placeName", "location", "title", "narrative", "imageIds"],
      },
    },
    closingText: { type: Type.STRING },
    majorLandmarks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "destination", "shortIntro", "stops", "closingText", "majorLandmarks"],
};

const askResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    relatedStopId: { type: Type.STRING, nullable: true },
  },
  required: ["answer"],
};

/* ------------------------------------------------------------------ */
/* 1. Multimodal understanding                                         */
/* ------------------------------------------------------------------ */

export type InlineImage = {
  imageId: string;
  mimeType: string;
  /** base64, no data: prefix */
  data: string;
};

export async function analyzeImages(images: InlineImage[], tripHint?: string | null): Promise<AnalysisResult> {
  const parts: Array<Record<string, unknown>> = [{ text: IMAGE_ANALYSIS_USER(images.length, tripHint) }];

  for (const image of images) {
    parts.push({ text: `imageId: ${image.imageId}` });
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const response = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: IMAGE_ANALYSIS_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema,
      temperature: 0.2,
    },
  });

  return AnalysisResultSchema.parse(JSON.parse(textOf(response)));
}

/* ------------------------------------------------------------------ */
/* 2. Function calling — place resolution                              */
/* ------------------------------------------------------------------ */

const getPlaceDetailsDeclaration = {
  name: "getPlaceDetails",
  description:
    "Resolve a heritage or tourism place name to its official name, address and coordinates on Google Maps. Call once per place.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      placeName: { type: Type.STRING, description: "Official name of the place, in Arabic when it has one." },
      city: { type: Type.STRING, description: "City or region the place belongs to, e.g. الدرعية، العلا، جدة." },
    },
    required: ["placeName"],
  } satisfies Schema,
};

/**
 * Runs a bounded tool-calling loop: Gemini decides which places to look up
 * and how to name them, our server executes the lookup against Google Places
 * (or the offline gazetteer), and the results are fed back to the model.
 */
export async function resolvePlaces(places: Array<{ name: string; city: string | null }>): Promise<Map<string, PlaceDetails>> {
  const resolved = new Map<string, PlaceDetails>();
  if (places.length === 0) return resolved;

  const history: Array<Record<string, unknown>> = [
    {
      role: "user",
      parts: [
        {
          text: `Resolve these places:\n${places
            .map((p, i) => `${i + 1}. ${p.name}${p.city ? ` (${p.city})` : ""}`)
            .join("\n")}`,
        },
      ],
    },
  ];

  // Bounded so a confused model can never spin: one turn per place, plus slack.
  const maxTurns = places.length + 3;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await ai().models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: PLACE_RESOLUTION_SYSTEM,
        tools: [{ functionDeclarations: [getPlaceDetailsDeclaration] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        temperature: 0,
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) break;

    history.push({ role: "model", parts: calls.map((call) => ({ functionCall: call })) });

    const responseParts: Array<Record<string, unknown>> = [];
    for (const call of calls) {
      const args = (call.args ?? {}) as { placeName?: string; city?: string };
      const placeName = args.placeName ?? "";
      const details = await getPlaceDetails(placeName, args.city ?? null);

      if (details) {
        resolved.set(normalizeKey(placeName), details);
        // Also key it by the name we originally asked about, so lookups match
        // even when the model tidied the spelling.
        const original = places.find((p) => normalizeKey(p.name) === normalizeKey(placeName));
        if (!original) {
          const near = places.find((p) => placeName.includes(p.name) || p.name.includes(placeName));
          if (near) resolved.set(normalizeKey(near.name), details);
        }
      }

      responseParts.push({
        functionResponse: {
          name: call.name,
          response: details ? { result: details } : { result: null, error: "not_found" },
        },
      });
    }

    history.push({ role: "user", parts: responseParts });
  }

  return resolved;
}

/** Direct (non-model) resolution used when we already know exactly what to look up. */
export async function resolvePlaceDirect(name: string, city: string | null): Promise<PlaceDetails | null> {
  const details = await getPlaceDetails(name, city);
  return details ? PlaceDetailsSchema.parse(details) : lookupGazetteer(name);
}

/* ------------------------------------------------------------------ */
/* 3. Google Search grounding                                          */
/* ------------------------------------------------------------------ */

/**
 * Note: Gemini does not allow a responseSchema alongside the googleSearch
 * tool, so this step returns prose and we take the citations from
 * groundingMetadata rather than trusting the model to report its own sources.
 */
export async function groundPlaceFact(placeName: string, city: string | null): Promise<GroundedFact> {
  const response = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: GROUNDING_USER(placeName, city) }] }],
    config: {
      systemInstruction: GROUNDING_SYSTEM,
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    },
  });

  const fact = textOf(response).trim();
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  const sources: Source[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({ title: chunk.web?.title || hostOf(uri), url: uri });
    if (sources.length >= 3) break;
  }

  const usable = fact.length > 0 && !fact.includes("NO_FACT");

  return {
    placeName,
    fact: usable ? fact : "",
    sources,
    // A "verified" fact requires citations. Prose alone is not verification.
    verified: usable && sources.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Structured output — journey composition                          */
/* ------------------------------------------------------------------ */

export async function composeJourney(payload: string, tripName?: string | null): Promise<JourneyDraft> {
  const response = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: JOURNEY_COMPOSITION_USER(payload, tripName) }] }],
    config: {
      systemInstruction: JOURNEY_COMPOSITION_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: journeyResponseSchema,
      temperature: 0.75,
    },
  });

  return JourneyDraftSchema.parse(JSON.parse(textOf(response)));
}

/* ------------------------------------------------------------------ */
/* 5. Ask about my trip                                                */
/* ------------------------------------------------------------------ */

export async function askAboutJourney(question: string, journeyContext: string): Promise<AskAnswer> {
  const response = await ai().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: `JOURNEY DATA:\n${journeyContext}\n\nQUESTION:\n${question}` }],
      },
    ],
    config: {
      systemInstruction: ASK_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: askResponseSchema,
      temperature: 0.4,
    },
  });

  const parsed = AskAnswerSchema.parse(JSON.parse(textOf(response)));
  return parsed;
}

/* ------------------------------------------------------------------ */

function textOf(response: { text?: string }): string {
  return response.text ?? "";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/[ً-ْ]/g, "") // strip Arabic diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
