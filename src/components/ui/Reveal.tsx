"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Scroll-reveal primitive.
 *
 * The observer writes `data-visible` straight to the DOM node instead of
 * going through React state: revealing is a one-way visual effect, and
 * re-rendering a section just to flip an attribute is wasted work on a page
 * that can hold dozens of them. One observer per element, disconnected as
 * soon as the element has appeared — a reveal is a first impression, not a loop.
 */
export function useReveal<T extends HTMLElement>(options?: { threshold?: number; rootMargin?: string }) {
  const ref = useRef<T | null>(null);
  const threshold = options?.threshold ?? 0.15;
  const rootMargin = options?.rootMargin ?? "0px 0px -8% 0px";

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const show = () => {
      element.dataset.visible = "true";
    };

    // jsdom and very old browsers: show everything rather than nothing.
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        show();
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      data-visible="false"
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
