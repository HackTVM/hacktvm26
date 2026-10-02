/**
 * HackTVM'26 — Access Point
 * MobileBeatPanel — the fixed bottom "content window".
 *
 * Renders exactly one beat at a time with a quick crossfade + vertical
 * translate. The panel root is pointer-events-none so touches fall through to
 * the full-screen scroller behind it (dragging anywhere — blob or panel area —
 * advances the blob). In development it warns once per beat if the beat's
 * content is taller than the panel, so layout regressions surface in console.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import type { Beat, BeatContent } from "@/lib/mobile-beats";
import { FlickerGroup } from "@/components/FlickerGroup";

const warnedBeats = new Set<string>();

/* Beat swap timing. `AnimatePresence mode="wait"` runs these in SERIES — the
   outgoing article must finish exiting before the incoming one mounts — so the
   first visible sign of a beat change lands at the EXIT duration, not at 0.
   Kept short, and opacity-only: the panel is fixed and does not move with the
   scroll, so this swap is the only feedback connecting a scroll to a new beat,
   and the old y-translate read as lag rather than as a transition. */
const BEAT_EXIT_DURATION = 0.06;
const BEAT_ENTER_DURATION = 0.14;

interface NavLink {
  label: string;
  href: string;
  disabled?: boolean;
}

/* Mirrors the desktop KeySection: the destination pages don't exist yet, so
   both links render in the disabled treatment until they ship. */
const links: readonly NavLink[] = [
  { label: "Builds", href: "#", disabled: true },
  { label: "Moments", href: "#", disabled: true },
];

function renderContent(content: BeatContent) {
  switch (content.kind) {
    case "hero":
      return (
        <div>
          <h1 className="font-mono text-xl font-bold leading-tight text-cream text-glow">
            {content.title}
          </h1>
          <FlickerGroup groupId={`mobile-hero-${content.title}`}>
            <p className="mt-1 font-mono text-[15px] uppercase tracking-wide text-blue">
              {content.tagline}
            </p>
            <p className="mt-2 text-[15px] leading-[1.5] text-gray-light">
              {content.body}
            </p>
          </FlickerGroup>
        </div>
      );

    case "facts":
      return (
        <div className="flex flex-col">
          {content.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2.5"
            >
              <FlickerGroup groupId={`mobile-facts-${fact.label}`} className="contents">
                <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-gray-mid">
                  {fact.label}
                </span>
                <span className="text-right text-[15px] leading-snug text-cream">
                  {fact.value}
                </span>
              </FlickerGroup>
            </div>
          ))}
        </div>
      );

    case "statement":
      return (
        <div>
          <h2 className="font-mono text-lg font-bold text-cream text-glow">
            {content.title}
          </h2>
          <FlickerGroup groupId={`mobile-statement-${content.title}-body`}>
            <p className="mt-2 text-[15px] leading-[1.5] text-gray-light">
              {content.body}
            </p>
          </FlickerGroup>
        </div>
      );

    case "list":
      return (
        <div>
          <h2 className="font-mono text-lg font-bold text-cream text-glow">
            {content.title}
          </h2>
          {content.intro && (
            <FlickerGroup groupId={`mobile-list-${content.title}-intro`}>
              <p className="mt-1.5 text-[15px] leading-[1.5] text-gray-mid">
                {content.intro}
              </p>
            </FlickerGroup>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {content.items.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 text-[15px] leading-[1.45] text-gray-light"
              >
                <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-blue" />
                <FlickerGroup groupId={`mobile-list-${content.title}-item-${item}`} className="contents">
                  <span>{item}</span>
                </FlickerGroup>
              </li>
            ))}
          </ul>
        </div>
      );

    case "points":
      return (
        <div>
          <h2 className="font-mono text-lg font-bold text-cream text-glow">
            {content.title}
          </h2>
          {content.intro && (
            <FlickerGroup groupId={`mobile-points-${content.title}-intro`}>
              <p className="mt-1.5 text-[15px] leading-[1.5] text-gray-mid">
                {content.intro}
              </p>
            </FlickerGroup>
          )}
          <div className="mt-3 flex flex-col gap-3.5">
            {content.entries.map((entry) => (
              <div key={entry.heading}>
                <h3 className="font-mono text-[15px] font-bold text-cream text-glow">
                  {entry.heading}
                </h3>
                <FlickerGroup groupId={`mobile-points-${content.title}-entry-${entry.heading}-body`} className="contents">
                  <p className="mt-0.5 text-[15px] leading-[1.5] text-gray-light">
                    {entry.body}
                  </p>
                </FlickerGroup>
              </div>
            ))}
          </div>
        </div>
      );

    case "note":
      return (
        <div>
          <h2 className="font-mono text-lg font-bold text-cream text-glow">
            {content.title}
          </h2>
          <FlickerGroup groupId={`mobile-note-${content.title}-body`}>
            <p className="mt-1.5 text-[15px] leading-[1.5] text-gray-light">
              {content.body}
            </p>
          </FlickerGroup>
        </div>
      );

    case "key":
      /* Nothing renders here — the panel stays empty until the Builds /
         Moments links fade in below. KeyHitArea's blinking prompt in the blob
         stage carries the affordance. */
      return null;
  }
}

interface MobileBeatPanelProps {
  beat: Beat;
  isKeyResolved: boolean;
  isKeyBeat: boolean;
}

export function MobileBeatPanel({ beat, isKeyResolved, isKeyBeat }: MobileBeatPanelProps) {
  const { isReducedMotion } = useApp();
  const boxRef = useRef<HTMLDivElement>(null);
  const [showLinks, setShowLinks] = useState(false);

  useEffect(() => {
    if (!isKeyBeat || !isKeyResolved) {
      setShowLinks(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowLinks(true);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [isKeyBeat, isKeyResolved]);

  /* Dev-only overflow warning: report any beat whose content is taller than
     the panel. The panel crossfades with AnimatePresence `mode="wait"`, so the
     beat's article mounts one exit-transition after the scroll lands — retry a
     few times until the article for the current beat is actually present,
     then measure just that article (never the still-exiting neighbour). */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (warnedBeats.has(beat.id)) return;

    let attempts = 0;
    let cancelled = false;
    let timer = 0;

    const measure = () => {
      if (cancelled) return;
      const box = boxRef.current;
      const article = box?.querySelector<HTMLElement>(`article[data-beat="${beat.id}"]`);
      if (!article) {
        if (attempts++ < 12) {
          timer = window.setTimeout(measure, 50);
        }
        return;
      }
      const panelHeight = box!.clientHeight;
      if (article.scrollHeight > panelHeight + 1) {
        warnedBeats.add(beat.id);
        console.warn(
          `[mobile-beats] "${beat.id}" content (${article.scrollHeight}px) overflows its panel (${panelHeight}px)`,
        );
      }
    };

    timer = window.setTimeout(measure, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [beat.id]);

  return (
    <div ref={boxRef} className="mobile-panel">
      <div className="h-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={beat.id}
            data-beat={beat.id}
            className={`h-full overflow-hidden px-5 pt-1 pb-1 ${
              /* The key beat renders no content of its own, so centring the
                 article vertically centres the links. Every other beat stays
                 top-aligned. */
              isKeyBeat ? "flex flex-col justify-center" : ""
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              isReducedMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, transition: { duration: BEAT_EXIT_DURATION } }
            }
            transition={
              isReducedMotion
                ? { duration: 0 }
                : { duration: BEAT_ENTER_DURATION, ease: "easeOut" }
            }
          >
            {renderContent(beat.content)}
            {isKeyBeat && showLinks && (
              <nav
                className="mx-auto w-full max-w-[80%] px-4 py-5 opacity-0 animate-fade-in transition-opacity duration-700"
                aria-label="Navigation"
              >
                <ul className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className={`
                          flex items-center justify-center
                          font-mono text-sm uppercase tracking-[0.2em]
                          rounded px-4 py-2 transition-colors
                          ${
                            link.disabled
                              ? "text-gray-500 cursor-not-allowed"
                              : "text-cream text-glow hover:text-cream/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream block text-center"
                          }
                        `}
                        aria-label={link.label}
                        aria-disabled={link.disabled}
                        tabIndex={link.disabled ? -1 : 0}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}