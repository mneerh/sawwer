"use client";

import { useLanguage } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-sand/50 bg-shell">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display text-base text-green-deep">
          صوِّر <span className="text-ink-faint">·</span>{" "}
          <span className="text-[0.85rem] tracking-wide text-ink-faint">{t.tagline}</span>
        </p>
        <p className="text-[0.78rem]">{t.common.localOnly}</p>
      </div>
    </footer>
  );
}
