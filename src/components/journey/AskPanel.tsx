"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/lib/i18n/context";
import type { Journey, Source } from "@/lib/ai/schemas";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  stopId?: string | null;
};

/**
 * Scoped to one trip on purpose: it answers from the journey's own structured
 * data, so it reads as part of the product rather than a chatbot bolted on.
 */
export function AskPanel({
  journey,
  open,
  onOpenChange,
  onFocusStop,
}: {
  journey: Journey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFocusStop?: (stopId: string) => void;
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setInput("");
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
    setPending(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, journey }),
      });

      if (!response.ok) throw new Error(String(response.status));

      const data = (await response.json()) as { answer: string; sources?: Source[]; relatedStopId?: string | null };
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.answer,
          sources: data.sources ?? [],
          stopId: data.relatedStopId ?? null,
        },
      ]);
    } catch {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", text: t.ask.error }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 end-6 z-40 flex items-center gap-2.5 rounded-full bg-green px-6 py-3.5 text-[0.9rem] text-shell shadow-[0_16px_38px_-14px_rgba(0,108,53,0.75)] transition-all hover:-translate-y-0.5 hover:bg-green-deep"
        >
          <span aria-hidden>✦</span>
          {t.ask.button}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={t.ask.title}>
          <button
            type="button"
            aria-label={t.ask.close}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in"
          />

          <div className="relative flex h-full w-full max-w-md flex-col border-s border-sand bg-shell shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-sand/70 px-6 py-5">
              <div>
                <h2 className="font-display text-[1.35rem] text-ink">{t.ask.title}</h2>
                <p className="mt-1 text-[0.8rem] text-ink-faint">{t.ask.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t.ask.close}
                className="rounded-full px-2.5 py-1 text-ink-faint transition-colors hover:bg-sand-light hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {messages.length === 0 && (
                <div className="space-y-2.5">
                  {t.ask.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => ask(suggestion)}
                      className="block w-full rounded-lg border border-sand/70 px-4 py-3 text-start font-serif text-[0.92rem] text-ink-soft transition-colors hover:border-green/50 hover:bg-sand-light/60 hover:text-ink"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) =>
                message.role === "user" ? (
                  <p
                    key={message.id}
                    className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-se-sm bg-green px-4 py-2.5 text-[0.92rem] text-shell"
                  >
                    {message.text}
                  </p>
                ) : (
                  <div key={message.id} className="max-w-[92%]">
                    <p className="font-serif text-[0.98rem] leading-[1.95] text-ink">{message.text}</p>

                    {message.sources && message.sources.length > 0 && (
                      <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem]">
                        {message.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-clay underline decoration-dotted underline-offset-4 hover:text-green"
                          >
                            {source.title}
                          </a>
                        ))}
                      </p>
                    )}

                    {message.stopId && onFocusStop && (
                      <button
                        type="button"
                        onClick={() => {
                          onFocusStop(message.stopId!);
                          onOpenChange(false);
                        }}
                        className="mt-3 text-[0.78rem] text-green underline decoration-dotted underline-offset-4"
                      >
                        {journey.stops.find((stop) => stop.id === message.stopId)?.placeName}
                      </button>
                    )}
                  </div>
                ),
              )}

              {pending && (
                <p className="flex items-center gap-2 text-[0.88rem] text-ink-faint" aria-live="polite">
                  {t.ask.thinking}
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1 w-1 animate-pulse rounded-full bg-clay"
                        style={{ animationDelay: `${dot * 180}ms` }}
                      />
                    ))}
                  </span>
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 border-t border-sand/70 px-4 py-4"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.ask.placeholder}
                aria-label={t.ask.placeholder}
                className="min-w-0 flex-1 rounded-full border border-sand bg-transparent px-5 py-2.5 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-ink-faint/60 focus:border-green"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="shrink-0 rounded-full bg-green px-5 py-2.5 text-[0.85rem] text-shell transition-colors hover:bg-green-deep disabled:bg-sand disabled:text-ink-faint"
              >
                {t.ask.send}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
