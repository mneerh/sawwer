import type { Locale } from "@/lib/i18n/dictionary";

/**
 * Formatting for wall-clock strings produced by EXIF extraction.
 *
 * Every value here is parsed with local Date components and formatted with the
 * same, so "15:12" in the file renders as 3:12 PM regardless of the viewer's
 * timezone. Nothing is ever routed through UTC.
 *
 * Arabic uses the Gregorian calendar explicitly — `ar-SA` otherwise resolves to
 * islamic-umalqura in some runtimes, which would silently show a different date
 * than the one written in the photo.
 */

function parseWallClock(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-GB";
}

/** "٣:١٢ م" / "3:12 PM" — null when the photo carried no time. */
export function formatTime(capturedAt: string | null, locale: Locale): string | null {
  if (!capturedAt || !capturedAt.includes("T")) return null;
  const date = parseWallClock(capturedAt);
  if (!date) return null;

  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    calendar: "gregory",
  }).format(date);
}

/** "١٨ يوليو ٢٠٢٦" / "18 July 2026" */
export function formatDate(value: string | null, locale: Locale): string | null {
  if (!value) return null;
  const date = parseWallClock(value.slice(0, 10));
  if (!date) return null;

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(date);
}

/** "١٨ يوليو" / "18 July" — used for day headings, where the year is redundant. */
export function formatDayDate(value: string | null, locale: Locale): string | null {
  if (!value) return null;
  const date = parseWallClock(value.slice(0, 10));
  if (!date) return null;

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    calendar: "gregory",
  }).format(date);
}

/** "١٨ – ٢٠ يوليو ٢٠٢٦" style range, collapsing to one date for a single day. */
export function formatDateRange(start: string | null, end: string | null, locale: Locale): string | null {
  if (!start) return null;
  if (!end || end === start) return formatDate(start, locale);

  const startDate = parseWallClock(start.slice(0, 10));
  const endDate = parseWallClock(end.slice(0, 10));
  if (!startDate || !endDate) return formatDate(start, locale);

  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  });

  // formatRange collapses shared parts for us ("18 – 20 July 2026").
  return formatter.formatRange(startDate, endDate);
}
