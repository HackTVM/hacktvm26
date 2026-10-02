/**
 * HackTVM'26 — Access Point
 * Full-screen loading overlay.
 *
 * Two-phase reveal:
 *   1. "in" appears instantly (no fade) — a real <button>, keyboard-focusable,
 *      strong glow + underline.
 *   2. After 1.5 s, "everyone deserves a way" flickers in as a group
 *      (neon-sign warm-up effect via CSS flicker animation, all at once).
 *
 * Entire phrase "everyone deserves a way in" is one line, one size.
 *
 * After 10s, if nobody has activated "in" yet, a slow-pulsing "click/tap 'in'"
 * hint fades in beneath the phrase and the "in" glyph itself picks up the same
 * pulse, so the two read as one gesture pointing at the actual target. That
 * hint is torn down the moment the screen is activated.
 *
 * On activation (click / Enter / Space): everything fades out,
 * then setIsLoading(false) removes the overlay from the DOM.
 *
 * Under prefers-reduced-motion: all words appear instantly (no flicker),
 * exit is instant.
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";

/*
 * Words that flicker in after the 1.5 s pause.
 * Non-sequential order: everyone -> a -> deserves -> way
 * Delays in ms, each word flickers independently.
 */
const FLICKER_WORDS = [
  { word: "everyone", delay: 1500 },
  { word: "deserves", delay: 2100 },
  { word: "a", delay: 1750 },
  { word: "way", delay: 2300 },
] as const;

/* Silence timer for the "click/tap 'in'" hint. The phrase reads as a statement
   with no obvious affordance, so if nobody has activated "in" after this long,
   say so. Same 10s the keycap's own hint uses (KeyHitArea's HINT_DELAY_MS). */
const HINT_DELAY_MS = 10_000;

export function LoadingScreen() {
  const { isLoading, setIsLoading, isReducedMotion, isTouchDevice } = useApp();
  const [isExiting, setIsExiting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  /* Timer is torn down as soon as the user activates "in", so the hint can
     never appear during — or after — the exit fade. */
  useEffect(() => {
    if (!isLoading || isExiting) return;
    const timer = window.setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading, isExiting]);

  const handleActivate = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
  }, [isExiting]);

  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: isReducedMotion ? 0 : 0.3 }}
      onAnimationComplete={() => {
        if (isExiting) setIsLoading(false);
      }}
    >
      {/*
        One line: "everyone deserves a way in"
        All words share the same text size.
        "in" is a real <button> — stronger glow + underline.

        Column wrapper so the "click in" hint can sit under the phrase without
        the phrase itself moving; the outer container still centres this as one
        block.
      */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-2xl sm:text-3xl text-cream text-glow select-none">
          {/* Flicker words — each appears independently, non-sequential order */}
          {FLICKER_WORDS.map(({ word, delay }) => (
            <span
              key={word}
              className="flicker-word"
              style={{ animationDelay: `${delay}ms` }}
            >
              {word}{" "}
            </span>
          ))}

          {/* "in" — instantly visible, stronger glow, underline, focusable.
              Gains the same slow pulse as the hint once it appears, so the eye
              is told which word the hint is talking about. */}
          <button
            type="button"
            onClick={handleActivate}
            className={[
              "text-glow-strong underline md:underline-offset-4 decoration-cream/60",
              "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-6",
              "focus-visible:outline-cream",
              showHint ? "animate-pulse-hint" : "",
            ].join(" ")}
            aria-label="Enter HackTVM'26"
          >
            in
          </button>
        </p>

        {/* Affordance hint — appears after HINT_DELAY_MS, only if still here.
            aria-hidden because the "in" button above is already a labelled,
            focusable control; this is redundant announcement. */}
        {showHint && (
          <p
            aria-hidden="true"
            className={[
              "font-mono text-xs uppercase tracking-[0.2em] whitespace-nowrap",
              "text-cream/70 pointer-events-none select-none",
              "animate-pulse-hint",
            ].join(" ")}
          >
            {isTouchDevice ? "Tap ‘in’" : "Click ‘in’"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
