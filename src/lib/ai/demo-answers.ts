import type { AskAnswer, Journey } from "@/lib/ai/schemas";

/**
 * DEMO ONLY — a small keyword responder used when GEMINI_API_KEY is absent,
 * so "اسأل عن رحلتك" is demonstrable offline. It reads the journey data and
 * never invents anything; when it cannot match, it says so.
 */
export function answerLocally(question: string, journey: Journey): AskAnswer {
  const q = question.trim().toLowerCase();
  const stops = journey.stops;

  const has = (...needles: string[]) => needles.some((needle) => q.includes(needle));

  if (stops.length === 0) {
    return { answer: "ما فيه محطات محفوظة في هذه الرحلة بعد.", relatedStopId: null, sources: [] };
  }

  if (has("أول", "اول", "بدأت", "بديت", "first", "start")) {
    const stop = stops[0];
    return {
      answer: `أول مكان في رحلتك كان ${stop.placeName}. ${stop.narrative}`,
      relatedStopId: stop.id,
      sources: [],
    };
  }

  if (has("آخر", "اخر", "انتهت", "نهاية", "last", "end")) {
    const stop = stops[stops.length - 1];
    return {
      answer: `آخر محطة كانت ${stop.placeName}. ${stop.narrative}`,
      relatedStopId: stop.id,
      sources: [],
    };
  }

  if (has("كم", "عدد", "how many", "count")) {
    return {
      answer: `في رحلتك ${journey.summary.numberOfPlaces} أماكن و${journey.summary.numberOfPhotos} صور، واكتشفت ${journey.summary.discoveredFactsCount} معلومات موثقة.`,
      relatedStopId: null,
      sources: [],
    };
  }

  if (has("أبرز", "ابرز", "اكتشفت", "معلومة", "قصة", "تاريخ", "fact", "history", "story", "discover")) {
    const stop = stops.find((candidate) => candidate.verifiedFact);
    if (stop?.verifiedFact) {
      return {
        answer: `من أبرز ما اكتشفته في رحلتك: ${stop.verifiedFact}`,
        relatedStopId: stop.id,
        sources: stop.sources,
      };
    }
  }

  // Try to match a place the user named.
  const named = stops.find((stop) => q.includes(stop.placeName.toLowerCase()) || q.includes(stop.title.toLowerCase()));
  if (named) {
    return {
      answer: named.verifiedFact ? `${named.narrative} ${named.verifiedFact}` : named.narrative,
      relatedStopId: named.id,
      sources: named.sources,
    };
  }

  return {
    answer: `ما لقيت إجابة لهذا السؤال في بيانات رحلتك. رحلتك تضم ${stops
      .map((stop) => stop.placeName)
      .join("، ")} — اسألني عن أي منها.`,
    relatedStopId: null,
    sources: [],
  };
}
