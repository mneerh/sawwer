"use client";

import Link from "next/link";

import { DemoPhoto } from "@/components/media/DemoPhoto";
import { Reveal } from "@/components/ui/Reveal";
import { DEMO_JOURNEY_ID } from "@/data/demo-journey";
import { useLanguage } from "@/lib/i18n/context";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <>
      <Hero />
      <HowItWorks />
      <SampleJourney />
      <ClosingCta />
      <span className="sr-only">{t.tagline}</span>
    </>
  );
}

function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* a single soft wash of sand behind the composition — no gradients-as-decoration */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-sand-light/60"
        style={{ clipPath: "ellipse(120% 100% at 50% 0%)" }}
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-fade-in">
          <p className="mb-6 text-[0.72rem] uppercase tracking-[0.32em] text-clay">Sawwer · صوِّر</p>

          <h1 className="font-display text-[clamp(2.35rem,6.2vw,4.15rem)] leading-[1.16] text-ink">
            <span className="block">{t.hero.titleLine1}</span>
            <span className="block text-green-deep">{t.hero.titleLine2}</span>
          </h1>

          <p className="mt-7 max-w-xl font-serif text-[1.06rem] leading-[1.95] text-ink-soft">{t.hero.body}</p>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/create"
              className="rounded-full bg-green px-8 py-3.5 text-[0.95rem] text-shell shadow-[0_10px_30px_-14px_rgba(0,108,53,0.7)] transition-all hover:-translate-y-0.5 hover:bg-green-deep"
            >
              {t.hero.primary}
            </Link>
            <a
              href="#how"
              className="group inline-flex items-center gap-2 text-[0.92rem] text-ink-soft transition-colors hover:text-green"
            >
              {t.hero.secondary}
              <span className="text-clay transition-transform group-hover:translate-y-0.5" aria-hidden>
                ↓
              </span>
            </a>
          </div>
        </div>

        {/* Editorial photo composition: one anchor image, two offset companions. */}
        <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm lg:max-w-[24rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[0.9rem] border border-sand/60 shadow-[0_30px_70px_-45px_rgba(46,41,37,0.7)]">
            <DemoPhoto imageId="demo-2" />
          </div>

          <div className="absolute -bottom-8 start-[-8%] hidden w-[46%] overflow-hidden rounded-[0.75rem] border-4 border-shell shadow-[0_24px_50px_-30px_rgba(46,41,37,0.6)] sm:block">
            <div className="aspect-[4/3]">
              <DemoPhoto imageId="demo-4" />
            </div>
          </div>

          <div className="absolute -top-7 end-[-6%] hidden w-[34%] overflow-hidden rounded-[0.75rem] border-4 border-shell shadow-[0_24px_50px_-30px_rgba(46,41,37,0.6)] lg:block">
            <div className="aspect-square">
              <DemoPhoto imageId="demo-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how" className="scroll-mt-24 border-t border-sand/50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-clay">{t.how.kicker}</p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.75rem)] leading-[1.3] text-ink">
            {t.how.title}
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg bg-sand/50 sm:grid-cols-3">
          {t.how.steps.map((step, index) => (
            <Reveal key={step.title} className="bg-shell p-8 sm:p-9" delay={index * 110}>
              <span className="font-display text-[2.6rem] leading-none text-sand tabular">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-[1.35rem] text-green-deep">{step.title}</h3>
              <p className="mt-3 font-serif text-[0.98rem] leading-[1.9] text-ink-soft">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SampleJourney() {
  const { t } = useLanguage();

  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-xl">
        {/* A horizon-based scene — it survives the wide crop that the
            perspective-heavy alley illustration does not. */}
        <div className="absolute inset-0">
          <DemoPhoto imageId="demo-4" />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/10"
          aria-hidden
        />

        <div className="relative flex min-h-[24rem] flex-col justify-end p-8 sm:min-h-[30rem] sm:p-14">
          <p className="text-[0.72rem] uppercase tracking-[0.3em] text-shell/70">{t.landing.sampleKicker}</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.1rem)] leading-tight text-shell">
            {t.landing.sampleTitle}
          </h2>
          <p className="mt-3 max-w-lg font-serif text-[1.02rem] leading-[1.9] text-shell/80">{t.landing.sampleBody}</p>

          <Link
            href={`/journey/${DEMO_JOURNEY_ID}`}
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-shell/45 px-7 py-3 text-[0.9rem] text-shell transition-all hover:bg-shell hover:text-green-deep"
          >
            {t.landing.sampleCta}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function ClosingCta() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-sand/50 py-24 text-center sm:py-32">
      <Reveal className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.35] text-ink">
          {t.landing.closingTitle}
        </h2>
        <Link
          href="/create"
          className="mt-10 inline-block rounded-full bg-green px-9 py-3.5 text-[0.95rem] text-shell transition-all hover:-translate-y-0.5 hover:bg-green-deep"
        >
          {t.landing.closingCta}
        </Link>
      </Reveal>
    </section>
  );
}
