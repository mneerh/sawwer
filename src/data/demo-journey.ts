import type { Journey, ImageAnalysis } from "@/lib/ai/schemas";

/**
 * ────────────────────────────────────────────────────────────────────
 *  DEMO CONTENT — NOT AI OUTPUT
 * ────────────────────────────────────────────────────────────────────
 * Everything in this file is hand-written sample content used when no
 * GEMINI_API_KEY is configured, so the experience can be demonstrated
 * end to end. Journeys built from it carry `mode: "demo"`, and the UI
 * shows a visible badge — demo content is never presented as a live
 * model result.
 *
 * The `verifiedFact` strings below are DEMO PLACEHOLDERS. They were
 * written by hand from the linked official sources rather than produced
 * by Google Search grounding. When GEMINI_API_KEY is present, this file
 * is not used and facts come from the grounded pipeline instead.
 */

export const DEMO_JOURNEY_ID = "demo-diriyah";

/** Ids of the illustrated placeholder photographs (see DemoPhoto). */
export const DEMO_IMAGE_IDS = ["demo-1", "demo-2", "demo-3", "demo-4", "demo-5"] as const;

export const demoJourney: Journey = {
  id: DEMO_JOURNEY_ID,
  title: "يوم في الدرعية",
  destination: "الدرعية، الرياض",
  date: "2025-11-14",
  coverImageId: "demo-1",
  shortIntro:
    "بدأ اليوم هادئًا، والطين ما زال محتفظًا ببرودة الليل. مشيتَ ببطء لأن المكان لا يُقرأ بسرعة، ووقفتَ كثيرًا أمام جدار لا يشبه أي جدار رأيته قبل ذلك.",
  stops: [
    {
      id: "stop-1",
      order: 1,
      imageIds: ["demo-1"],
      placeName: "حي الطريف",
      location: "الدرعية، الرياض",
      title: "أول ما رأيته",
      narrative:
        "دخلتَ من الجهة الغربية، والشمس ما زالت منخفضة. الجدران الطينية كانت تبدو أفتح مما تخيلت، والظل يقطعها بخطوط حادة. توقفتَ عند أول ممر ضيق، ورفعتَ الكاميرا دون أن تعرف تحديدًا ما الذي تصوّره.",
      verifiedFact:
        "أُدرج حي الطريف في الدرعية على قائمة التراث العالمي لليونسكو عام 2010، بوصفه شاهدًا على العمارة الطينية في وسط الجزيرة العربية.",
      sources: [
        { title: "UNESCO — At-Turaif District in ad-Dir'iyah", url: "https://whc.unesco.org/en/list/1329/" },
      ],
      coordinates: { lat: 24.7337, lng: 46.5726 },
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=24.7337,46.5726",
      confidence: 0.94,
    },
    {
      id: "stop-2",
      order: 2,
      imageIds: ["demo-2"],
      placeName: "قصر سلوى",
      location: "حي الطريف، الدرعية",
      title: "الجدار الذي لا ينتهي",
      narrative:
        "هنا صارت المباني أطول فجأة. وقفتَ بعيدًا لتُدخل الواجهة كاملة في الصورة، ثم اقتربتَ لأن التفاصيل الصغيرة كانت أجمل: الفتحات المثلثة، وأثر الأيدي في الطين.",
      verifiedFact:
        "قصر سلوى هو أكبر مجمّع معماري في حي الطريف، وقد اتخذه حكّام الدولة السعودية الأولى مقرًّا للحكم والسكن.",
      sources: [
        { title: "هيئة تطوير بوابة الدرعية", url: "https://www.diriyah.sa/" },
        { title: "UNESCO — At-Turaif District in ad-Dir'iyah", url: "https://whc.unesco.org/en/list/1329/" },
      ],
      coordinates: { lat: 24.7341, lng: 46.5719 },
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=24.7341,46.5719",
      confidence: 0.91,
    },
    {
      id: "stop-3",
      order: 3,
      imageIds: ["demo-3"],
      placeName: "وادي حنيفة",
      location: "الدرعية، الرياض",
      title: "استراحة تحت النخل",
      narrative:
        "نزلتَ نحو الوادي بحثًا عن الظل. كان الهواء أبرد بدرجتين، وصوت المكان تغيّر تمامًا. جلستَ دقائق لم تصوّر فيها شيئًا، ثم التقطتَ صورة واحدة للنخيل وهي تميل مع الضوء.",
      verifiedFact:
        "وادي حنيفة مجرى مائي يمتد لأكثر من 100 كيلومتر عبر منطقة الرياض، وقد أُعيد تأهيله بيئيًا ليصبح متنزهًا طبيعيًا ممتدًا.",
      sources: [{ title: "الهيئة الملكية لمدينة الرياض", url: "https://www.rcrc.gov.sa/" }],
      coordinates: { lat: 24.7215, lng: 46.5866 },
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=24.7215,46.5866",
      confidence: 0.72,
    },
    {
      id: "stop-4",
      order: 4,
      imageIds: ["demo-4", "demo-5"],
      placeName: "البجيري",
      location: "الدرعية، الرياض",
      title: "آخر الضوء",
      narrative:
        "عدتَ صعودًا حين بدأ اللون يتحوّل. الطين الذي كان فاتحًا في الصباح صار برتقاليًا، والناس حولك يمشون أبطأ. آخر صورتين في هاتفك من هنا، والاثنتان لنفس الجدار قبل أن يختفي الضوء.",
      verifiedFact:
        "يقع حي البجيري على الضفة المقابلة لحي الطريف عبر وادي حنيفة، ويضم مسجد الإمام محمد بن عبدالوهاب.",
      sources: [{ title: "هيئة تطوير بوابة الدرعية", url: "https://www.diriyah.sa/" }],
      coordinates: { lat: 24.7362, lng: 46.5766 },
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=24.7362,46.5766",
      confidence: 0.88,
    },
  ],
  summary: {
    numberOfPhotos: 5,
    numberOfPlaces: 4,
    majorLandmarks: ["حي الطريف", "قصر سلوى", "البجيري"],
    discoveredFactsCount: 4,
    // Deliberately not the section heading — the heading is fixed UI copy, and
    // this line belongs to the journey itself.
    closingText: "لم تكن رحلة طويلة، لكنها كانت كافية لتبقى.",
  },
  mapLocations: [
    { stopId: "stop-1", label: "حي الطريف", coordinates: { lat: 24.7337, lng: 46.5726 } },
    { stopId: "stop-2", label: "قصر سلوى", coordinates: { lat: 24.7341, lng: 46.5719 } },
    { stopId: "stop-3", label: "وادي حنيفة", coordinates: { lat: 24.7215, lng: 46.5866 } },
    { stopId: "stop-4", label: "البجيري", coordinates: { lat: 24.7362, lng: 46.5766 } },
  ],
  createdAt: "2025-11-14T16:40:00.000Z",
  mode: "demo",
};

/**
 * Demo stand-ins for Gemini's multimodal output, used to drive the review
 * screen when no key is configured. `templates` are cycled over whatever
 * photos the user actually uploaded, so the flow still reacts to real input.
 */
const analysisTemplates: Array<Omit<ImageAnalysis, "imageId">> = [
  {
    possiblePlace: "حي الطريف",
    possibleLandmark: "حي الطريف",
    city: "الدرعية",
    visualDescription: "ممر ضيق بين جدران طينية فاتحة، وضوء صباحي منخفض يرسم ظلالًا حادة على الأرض.",
    heritageElements: ["عمارة نجدية طينية", "فتحات مثلثة", "ممرات ضيقة"],
    visibleText: [],
    timeOfDay: "morning",
    confidence: 0.94,
  },
  {
    possiblePlace: "قصر سلوى",
    possibleLandmark: "قصر سلوى",
    city: "الدرعية",
    visualDescription: "واجهة طينية مرتفعة متعددة الطوابق، بأبراج مستطيلة وفتحات صغيرة منتظمة.",
    heritageElements: ["جدران طينية سميكة", "أبراج دفاعية", "شرفات مسننة"],
    visibleText: [],
    timeOfDay: "midday",
    confidence: 0.91,
  },
  {
    possiblePlace: "وادي حنيفة",
    possibleLandmark: null,
    city: "الرياض",
    visualDescription: "نخيل كثيف وظل واسع على أرض ترابية، مع مجرى مائي ضيق في الخلفية.",
    heritageElements: ["نخيل", "مجرى الوادي"],
    visibleText: [],
    timeOfDay: "afternoon",
    confidence: 0.72,
  },
  {
    possiblePlace: "البجيري",
    possibleLandmark: "حي البجيري",
    city: "الدرعية",
    visualDescription: "ساحة مفتوحة بجدران طينية يميل لونها إلى البرتقالي مع اقتراب الغروب.",
    heritageElements: ["ساحة عامة", "طين نجدي", "إضاءة دافئة"],
    visibleText: [],
    timeOfDay: "sunset",
    confidence: 0.88,
  },
  {
    possiblePlace: "البجيري",
    possibleLandmark: null,
    city: "الدرعية",
    visualDescription: "تفصيل قريب لجدار طيني تظهر عليه آثار التشكيل اليدوي في الضوء الأخير.",
    heritageElements: ["ملمس الطين", "أثر البناء اليدوي"],
    visibleText: [],
    timeOfDay: "sunset",
    confidence: 0.61,
  },
];

export function demoAnalysisFor(imageIds: string[]): ImageAnalysis[] {
  return imageIds.map((imageId, index) => ({
    imageId,
    ...analysisTemplates[index % analysisTemplates.length],
  }));
}

/** Builds a demo journey around the user's own uploads, keeping their photos. */
export function demoJourneyFor(options: {
  id: string;
  imageIds: string[];
  tripName?: string | null;
}): Journey {
  const { id, imageIds, tripName } = options;
  if (imageIds.length === 0) return { ...demoJourney, id };

  const template = demoJourney.stops;
  const stopCount = Math.min(template.length, Math.max(1, imageIds.length));

  // Spread the uploaded photos across the demo stops, in order.
  const buckets: string[][] = Array.from({ length: stopCount }, () => []);
  imageIds.forEach((imageId, index) => {
    buckets[Math.min(stopCount - 1, Math.floor((index * stopCount) / imageIds.length))].push(imageId);
  });

  const stops = template.slice(0, stopCount).map((stop, index) => ({
    ...stop,
    imageIds: buckets[index],
  }));

  return {
    ...demoJourney,
    id,
    title: tripName?.trim() || demoJourney.title,
    coverImageId: imageIds[0],
    date: new Date().toISOString().slice(0, 10),
    stops,
    summary: {
      ...demoJourney.summary,
      numberOfPhotos: imageIds.length,
      numberOfPlaces: stops.length,
      majorLandmarks: stops.map((stop) => stop.placeName),
      discoveredFactsCount: stops.filter((stop) => stop.verifiedFact).length,
    },
    mapLocations: demoJourney.mapLocations.slice(0, stopCount),
    createdAt: new Date().toISOString(),
    mode: "demo",
  };
}
