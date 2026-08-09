/**
 * Arabic is the product's first language — the English copy is a faithful
 * translation, not the source. `ar` defines the shape; `en` must match it.
 */

export const ar = {
  brand: "صوِّر",
  brandLatin: "Sawwer",
  tagline: "صوِّر، ودع رحلتك تحكي.",

  nav: {
    home: "الرئيسية",
    how: "كيف يعمل؟",
    journeys: "رحلاتي",
    start: "ابدأ رحلتك",
  },

  hero: {
    titleLine1: "صورك تحفظ اللحظة،",
    titleLine2: "وصوِّر يعيد لك الرحلة.",
    body: "ارفع صور سفرتك ودع الذكاء الاصطناعي يحولها إلى رحلة تفاعلية تجمع صورك، الأماكن التي زرتها، وقصصها الموثقة.",
    primary: "حوّل صورك إلى رحلة",
    secondary: "شاهد كيف يعمل",
    scroll: "تابع",
  },

  how: {
    kicker: "كيف يعمل",
    title: "ثلاث خطوات، ورحلتك ترجع.",
    steps: [
      { title: "ارفع صورك", body: "اختر صور رحلتك من معرضك. لا حاجة لترتيبها أو تسميتها." },
      { title: "نكتشف الأماكن وقصصها", body: "نقرأ الصور، نتعرف على المعالم، ونتحقق من معلوماتها التاريخية." },
      { title: "عِش رحلتك من جديد", body: "رحلة تُقرأ كقصة: صورك، محطاتك، وخريطة يومك." },
    ],
  },

  landing: {
    sampleKicker: "من رحلات صوِّر",
    sampleTitle: "يوم في الدرعية",
    sampleBody: "خمس صور، أربع محطات، ويوم كامل عاد كما كان.",
    sampleCta: "افتح الرحلة",
    closingTitle: "رحلتك لم تنتهِ، فقط تحتاج من يرويها.",
    closingCta: "ابدأ رحلتك",
  },

  create: {
    title: "لنستعيد رحلتك",
    subtitle: "اختر الصور التي التقطتها خلال رحلتك، وسنرتب لك الحكاية.",
    dropTitle: "اسحب صورك هنا",
    dropSubtitle: "أو تصفّح معرض الصور",
    dropFormats: "JPG · PNG · WEBP — حتى ١٢ صورة",
    browse: "تصفّح الصور",
    photosCount: (n: number) => `${n} صور مختارة`,
    tripNameLabel: "اسم الرحلة — اختياري",
    tripNamePlaceholder: "يوم في الدرعية",
    destinationLabel: "الوجهة — اختياري",
    destinationPlaceholder: "الدرعية، العلا، جدة التاريخية...",
    destinationHint: "لا تحتاج لتحديد كل مكان — هذا عمل صوِّر.",
    cta: "اكتشف رحلتي",
    remove: "إزالة الصورة",
    moveBack: "تحريك للخلف",
    moveForward: "تحريك للأمام",
    preview: "معاينة",
    closePreview: "إغلاق المعاينة",
    emptyHint: "أضف صورة واحدة على الأقل للبدء.",
    tooMany: "الحد الأقصى ١٢ صورة في هذه النسخة.",
    badType: (name: string) => `${name}: صيغة غير مدعومة.`,
    tooLarge: (name: string) => `${name}: حجم الصورة كبير جدًا.`,
  },

  processing: {
    steps: [
      "نقرأ صور رحلتك...",
      "نتعرف على الأماكن...",
      "نبحث عن قصصها...",
      "نتحقق من المعلومات...",
      "نرتب محطات رحلتك...",
      "نكتب قصتك...",
    ],
    hint: "خذ نفسًا — نحن نعيد ترتيب يومك.",
    failed: "تعذّر إكمال الرحلة",
    retry: "حاول مرة أخرى",
    back: "رجوع",
  },

  review: {
    kicker: "مراجعة سريعة",
    title: (n: number) => `وجدنا ${n} ${n === 1 ? "محطة" : n === 2 ? "محطتين" : "محطات"} في رحلتك`,
    subtitle: "احذف ما ليس صحيحًا، أو صحّح الاسم. ثم نكمل.",
    uncertain: "غير مؤكد",
    photos: (n: number) => `${n} ${n === 1 ? "صورة" : "صور"}`,
    rename: "تعديل الاسم",
    removePlace: "حذف المحطة",
    noTime: "الوقت غير متوفر",
    noDate: "ما لقينا تاريخ في بيانات الصور.",
    days: (n: number) => `${n} أيام`,
    dayLabel: (n: number) =>
      `اليوم ${n === 1 ? "الأول" : n === 2 ? "الثاني" : n === 3 ? "الثالث" : n === 4 ? "الرابع" : n === 5 ? "الخامس" : n}`,
    unnamedPlace: "مكان غير محدد",
    withoutTime: (n: number) =>
      `${n} ${n === 1 ? "صورة" : "صور"} بدون وقت في بياناتها — حافظنا على ترتيب رفعها.`,
    unplaced: (n: number) => `${n} ${n === 1 ? "صورة" : "صور"} بدون مكان محدد — سنضمها للرحلة.`,
    addPlace: "إضافة محطة",
    newPlace: "اسم المكان",
    cta: "ابنِ رحلتي",
    emptyTitle: "ما تعرّفنا على أماكن واضحة",
    emptyBody: "أضف اسم مكان يدويًا، أو ارجع واختر صورًا فيها معالم ظاهرة.",
  },

  journey: {
    start: "ابدأ الرحلة",
    fromMemory: "من ذاكرة المكان",
    verified: "معلومة موثقة",
    source: "المصدر",
    openInMaps: "افتح في خرائط جوجل",
    mapTitle: "رحلتك على الخريطة",
    mapSubtitle: "المحطات التي صنعت رحلتك.",
    openRoute: "افتح المسار في خرائط جوجل",
    goToStop: "اذهب إلى هذه المحطة",
    stopLabel: "المحطة",
    endTitle: "وهنا انتهت الرحلة،",
    endTitle2: "لكن صورها ما زالت تحكي.",
    photos: "صور",
    places: "أماكن",
    facts: "حقائق اكتشفتها",
    ask: "اسأل عن رحلتي",
    share: "شارك الرحلة",
    shared: "تم نسخ الرابط",
    notFoundTitle: "ما لقينا هذه الرحلة",
    notFoundBody: "قد تكون محفوظة على جهاز آخر. ابدأ رحلة جديدة أو تصفّح رحلاتك.",
    demoBadge: "محتوى عرض توضيحي",
    demoNote: "هذه الرحلة أُنشئت بمحتوى تجريبي لأن مفاتيح الذكاء الاصطناعي غير مهيأة.",
    uncertainStop: "مكان غير مؤكد",
    noTime: "الوقت غير متوفر",
    unnamedPlace: "مكان غير محدد",
    dayLabel: (n: number) =>
      `اليوم ${n === 1 ? "الأول" : n === 2 ? "الثاني" : n === 3 ? "الثالث" : n === 4 ? "الرابع" : n === 5 ? "الخامس" : n}`,
  },

  ask: {
    button: "اسأل عن رحلتك",
    title: "اسأل عن رحلتك",
    subtitle: "أجيبك من رحلتك أنت — لا من الإنترنت.",
    placeholder: "اكتب سؤالك...",
    send: "إرسال",
    close: "إغلاق",
    thinking: "أفكر...",
    error: "تعذّر الوصول للإجابة. حاول مرة أخرى.",
    suggestions: [
      "ما أول مكان زرته؟",
      "ما قصة هذا المبنى؟",
      "وش أبرز شيء اكتشفته في رحلتي؟",
      "كم مكان زرت؟",
    ],
  },

  journeys: {
    kicker: "مكتبتك",
    title: "رحلاتي",
    subtitle: "كل رحلة صنعتها، محفوظة على هذا الجهاز.",
    stops: (n: number) => `${n} ${n === 1 ? "محطة" : n === 2 ? "محطتان" : "محطات"}`,
    emptyTitle: "ما عندك رحلات بعد",
    emptyBody: "ارفع صور سفرتك الأخيرة، وشوف كيف ترجع.",
    emptyCta: "ابدأ رحلتك الأولى",
    delete: "حذف الرحلة",
    demo: "عرض توضيحي",
  },

  common: {
    loading: "لحظة...",
    error: "صار خطأ غير متوقع.",
    back: "رجوع",
    localOnly: "رحلاتك محفوظة على جهازك فقط.",
  },
};

/**
 * `ar` is deliberately not `as const` — its inferred (widened) shape becomes
 * the contract every other locale must satisfy.
 */
export type Dictionary = typeof ar;

export const en: Dictionary = {
  brand: "Sawwer",
  brandLatin: "صوِّر",
  tagline: "Turn your travel photos into a story worth remembering.",

  nav: {
    home: "Home",
    how: "How it works",
    journeys: "My journeys",
    start: "Start your journey",
  },

  hero: {
    titleLine1: "Your photos keep the moment.",
    titleLine2: "Sawwer gives back the journey.",
    body: "Upload the photos from your trip and let AI turn them into an interactive journey — your images, the places you visited, and their verified stories.",
    primary: "Turn photos into a journey",
    secondary: "See how it works",
    scroll: "Scroll",
  },

  how: {
    kicker: "How it works",
    title: "Three steps, and your trip comes back.",
    steps: [
      { title: "Upload your photos", body: "Pick the photos from your trip. No sorting, no labelling." },
      { title: "We find the places", body: "We read the photos, recognise the landmarks, and verify their history." },
      { title: "Relive the journey", body: "A trip that reads like a story: your photos, your stops, your map." },
    ],
  },

  landing: {
    sampleKicker: "From Sawwer journeys",
    sampleTitle: "A day in Diriyah",
    sampleBody: "Five photos, four stops, and a whole day returned.",
    sampleCta: "Open the journey",
    closingTitle: "Your journey isn't over. It just needs telling.",
    closingCta: "Start your journey",
  },

  create: {
    title: "Let's bring your trip back",
    subtitle: "Choose the photos you took along the way, and we'll arrange the story.",
    dropTitle: "Drop your photos here",
    dropSubtitle: "or browse your library",
    dropFormats: "JPG · PNG · WEBP — up to 12 photos",
    browse: "Browse photos",
    photosCount: (n: number) => `${n} photo${n === 1 ? "" : "s"} selected`,
    tripNameLabel: "Trip name — optional",
    tripNamePlaceholder: "A day in Diriyah",
    destinationLabel: "Destination — optional",
    destinationPlaceholder: "Diriyah, AlUla, Historic Jeddah…",
    destinationHint: "You don't need to name every place — that's Sawwer's job.",
    cta: "Discover my journey",
    remove: "Remove photo",
    moveBack: "Move back",
    moveForward: "Move forward",
    preview: "Preview",
    closePreview: "Close preview",
    emptyHint: "Add at least one photo to begin.",
    tooMany: "Up to 12 photos in this version.",
    badType: (name: string) => `${name}: unsupported format.`,
    tooLarge: (name: string) => `${name}: file is too large.`,
  },

  processing: {
    steps: [
      "Reading your photos…",
      "Recognising the places…",
      "Looking for their stories…",
      "Verifying the details…",
      "Ordering your stops…",
      "Writing your story…",
    ],
    hint: "Take a breath — we're putting your day back together.",
    failed: "We couldn't finish the journey",
    retry: "Try again",
    back: "Back",
  },

  review: {
    kicker: "Quick review",
    title: (n: number) => `We found ${n} stop${n === 1 ? "" : "s"} in your trip`,
    subtitle: "Remove anything wrong, or fix a name. Then we continue.",
    uncertain: "Unconfirmed",
    photos: (n: number) => `${n} photo${n === 1 ? "" : "s"}`,
    rename: "Edit name",
    removePlace: "Remove stop",
    noTime: "Time unavailable",
    noDate: "No date found in the photo metadata.",
    days: (n: number) => `${n} days`,
    dayLabel: (n: number) => `Day ${n}`,
    unnamedPlace: "Unidentified place",
    withoutTime: (n: number) =>
      `${n} photo${n === 1 ? "" : "s"} carried no time — we kept your upload order for ${n === 1 ? "it" : "them"}.`,
    unplaced: (n: number) => `${n} photo${n === 1 ? "" : "s"} without a clear place — we'll still include them.`,
    addPlace: "Add a stop",
    newPlace: "Place name",
    cta: "Build my journey",
    emptyTitle: "We couldn't recognise clear places",
    emptyBody: "Add a place name manually, or go back and pick photos with visible landmarks.",
  },

  journey: {
    start: "Begin the journey",
    fromMemory: "From the memory of the place",
    verified: "Verified",
    source: "Source",
    openInMaps: "Open in Google Maps",
    mapTitle: "Your journey on the map",
    mapSubtitle: "The stops that made your trip.",
    openRoute: "Open the route in Google Maps",
    goToStop: "Go to this stop",
    stopLabel: "Stop",
    endTitle: "And here the journey ended,",
    endTitle2: "but the photos are still telling it.",
    photos: "photos",
    places: "places",
    facts: "facts discovered",
    ask: "Ask about my trip",
    share: "Share journey",
    shared: "Link copied",
    notFoundTitle: "We couldn't find this journey",
    notFoundBody: "It may be saved on another device. Start a new journey or browse your library.",
    demoBadge: "Demo content",
    demoNote: "This journey was built from sample content because AI credentials aren't configured.",
    uncertainStop: "Unconfirmed place",
    noTime: "Time unavailable",
    unnamedPlace: "Unidentified place",
    dayLabel: (n: number) => `Day ${n}`,
  },

  ask: {
    button: "Ask about your trip",
    title: "Ask about your trip",
    subtitle: "Answers come from your journey — not the open web.",
    placeholder: "Type your question…",
    send: "Send",
    close: "Close",
    thinking: "Thinking…",
    error: "Couldn't reach an answer. Try again.",
    suggestions: [
      "Where did I start?",
      "What's the story of this building?",
      "What was the most interesting thing I found?",
      "How many places did I visit?",
    ],
  },

  journeys: {
    kicker: "Your library",
    title: "My journeys",
    subtitle: "Every journey you've made, saved on this device.",
    stops: (n: number) => `${n} stop${n === 1 ? "" : "s"}`,
    emptyTitle: "No journeys yet",
    emptyBody: "Upload the photos from your last trip and watch it come back.",
    emptyCta: "Start your first journey",
    delete: "Delete journey",
    demo: "Demo",
  },

  common: {
    loading: "One moment…",
    error: "Something went wrong.",
    back: "Back",
    localOnly: "Your journeys are stored on your device only.",
  },
};

export const dictionaries = { ar, en } as const;
export type Locale = keyof typeof dictionaries;
