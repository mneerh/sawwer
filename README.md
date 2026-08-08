# Sawwer | صوِّر

> صوِّر، ودع رحلتك تحكي.
> Turn your travel photos into a story worth remembering.

Sawwer is an AI-powered tourism memory experience. It takes the photos you already
have — after the trip is over — and gives you back the journey: the places you
walked through, in the order you walked them, with their verified history attached.

**صوِّر** is the imperative verb *"capture / take a photo"* — not صور (photos).

---

## The problem

You come back from Diriyah, AlUla or Historic Jeddah with forty photos on your
phone. Six months later you can't remember which building was which, what order
the day happened in, or why that wall mattered. The photos survive; the journey
doesn't.

## The solution

Upload the photos. Sawwer reads them, identifies the landmarks, verifies their
history against real sources, orders them into a single day, and renders the
result as an interactive journey you scroll through — photo essay, timeline and
heritage guide in one.

## Core user flow

```
Landing → Create journey → Upload photos → AI processing
       → Review detected stops → Build → Immersive journey → Ask about my trip
```

---

## Gemini capabilities used

| Capability | Where | What it does |
|---|---|---|
| **Multimodal understanding** | `src/lib/ai/gemini.ts` → `analyzeImages` | Reads every photo and returns place candidates, heritage elements, visible signage, time of day and an honest confidence score. |
| **Google Search grounding** | `groundPlaceFact` | Retrieves one verifiable historical fact per place. Citations are read from `groundingMetadata`, not from the model's prose — a fact without retrieved sources is never marked verified. |
| **Function calling** | `resolvePlaces` + `getPlaceDetails` declaration | Gemini decides how to name each place and calls our `getPlaceDetails` tool; the server executes it against Google Places and feeds the result back. |
| **Structured output** | `composeJourney` | The journey is generated against a typed `responseSchema` and validated with Zod. No prose parsing. |

### How uncertainty is handled

This matters more than any single feature:

- The model is instructed never to name a landmark it isn't reasonably sure of.
  Low-confidence places are surfaced as **غير مؤكد** on the review screen and the
  journey page instead of being asserted.
- The **narrative** is explicitly forbidden from containing dates, dynasties or
  historical claims. Those live only in the separate verified-fact block.
- `verifiedFact` is populated **only** when Google Search grounding returned
  citations. Everything else renders without one.
- Stop ids, coordinates, source URLs and map links are attached by our own code
  after generation — so a hallucinated URL can never reach the page.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Zod** for schema validation at every AI boundary
- **@google/genai** — the current official Google Gen AI SDK
- **Google Places API (New)** and **Google Maps Embed API** (both optional)
- **IndexedDB** for local persistence of journeys and photos

Thmanyah is the typeface throughout (sans, serif text, and serif display),
self-hosted from `public/fonts` via `@font-face`.

---

## Running locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. **It works with no configuration at all** — see
Demo mode below.

```bash
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is optional.

| Variable | Exposure | Effect when missing |
|---|---|---|
| `GEMINI_API_KEY` | server only | App runs in demo mode |
| `GOOGLE_PLACES_API_KEY` | server only | Falls back to a built-in gazetteer of Saudi heritage sites |
| `GOOGLE_MAPS_API_KEY` | server only | Used as a fallback credential for Places |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **browser** | Journey renders its own illustrated map |

Recommended setup: one Google Cloud project with *Generative Language API*,
*Places API (New)* and *Maps Embed API* enabled. Use a **separate**,
HTTP-referrer-restricted key for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — never reuse
the server key in the browser.

All Gemini and Places calls happen in server route handlers. No secret is ever
sent to the client.

## Demo mode

Demo mode is **not** a mock of the API — it is a separate, clearly-labelled
content path:

- Triggered automatically when `GEMINI_API_KEY` is absent (`/api/config` reports
  the live state).
- Demo journeys carry `mode: "demo"` and render a visible **محتوى عرض توضيحي**
  badge plus an explanatory note at the end of the journey.
- Sample content lives only in `src/data/demo-journey.ts`, whose `verifiedFact`
  strings are marked in-file as hand-written placeholders drawn from the linked
  official sources — they are not passed off as grounded model output.
- Uploading your own photos in demo mode still works: your photos are used, with
  the sample Diriyah narrative wrapped around them.

The sample journey (*يوم في الدرعية*) is always available at
`/journey/demo-diriyah`. Its photographs are illustrated SVG scenes, so the demo
needs no assets and no network.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/create` | Upload → processing → review (single stateful flow) |
| `/journey/[id]` | The immersive journey |
| `/journeys` | Personal journey library |
| `/api/analyze` | Multimodal analysis → detected places |
| `/api/journey` | Function calling + grounding + structured composition |
| `/api/ask` | Scoped Q&A over one journey |
| `/api/config` | Reports which capabilities are live |

## Architecture

```
src/
  app/                    routes + API route handlers
  components/
    layout/  upload/  journey/  map/  media/  ui/
  lib/
    ai/       gemini.ts  prompts.ts  schemas.ts  pipeline.ts  demo-answers.ts
    google/   places.ts  maps.ts
    storage/  db.ts  journeys.ts        (IndexedDB — swap this to add a backend)
    i18n/     context.tsx  dictionary.ts
    images.ts
  data/       demo-journey.ts
public/fonts/ Thmanyah woff2 + license
```

The AI pipeline is split into stages so the processing screen can report **real**
progress rather than a fake percentage: `/api/analyze` covers reading the photos
and recognising places, `/api/journey` covers grounding, verification, ordering
and writing.

Persistence is deliberately local-only for the MVP. Replacing
`src/lib/storage/journeys.ts` with a Supabase/Firebase implementation is the only
change needed to move journeys off-device.

## Language

Arabic-first with full RTL. English is available from the header and switches the
interface to LTR. Generated journey *content* stays in the language it was
written in.

---

Repository: https://github.com/mneerh/sawwer
