/**
 * HackTVM'26 — Access Point
 * useLatchedProgress — key-resolution lock-in.
 *
 * The blob→key morph only ever happens on the FIRST trip to the end of the
 * page. The moment the key fully resolves (progress reaches BlobMorph's
 * KEY_RIGID_PROGRESS, where the detail is fully visible and further scroll is
 * visually identical), the effective progress latches to 1 for the rest of the
 * session: the resolved key permanently replaces the blob on every section,
 * so scrolling back up/down never replays the shapeless/resolving blob states.
 *
 * Before the latch, raw progress passes through untouched (first visit is
 * exactly as before). This only transforms the progress VALUE fed into
 * BlobMorph — its physics loop and thresholds are never touched.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { KEY_RIGID_PROGRESS } from "@/components/BlobMorph";

export function useLatchedProgress(raw: number): number {
  const resolvedRef = useRef(false);

  if (raw >= KEY_RIGID_PROGRESS) {
    /* Full resolution is only reached on the key section (desktop scroll or
       mobile key beats), so latching here is unambiguous. */
    resolvedRef.current = true;
  }

  return resolvedRef.current ? 1 : raw;
}

/**
 * The same lock-in, as a STICKY BOOLEAN, for consumers that only need to know
 * *whether* the key is resolved rather than the continuous progress value
 * (KeyHitArea and KeySection both only ever test `progress >=
 * KEY_RIGID_PROGRESS`).
 *
 * Why this exists: the desktop path used to feed `scrollYProgress` into React
 * state via `useMotionValueEvent`, which re-rendered the entire experience tree
 * on every scroll frame just to compute two booleans. Reading the MotionValue
 * directly here means scroll updates never enter the React render path at all —
 * this hook flips `true` at most ONCE per session, so `KeyHitArea` and
 * `KeySection` re-render once instead of ~60x/second.
 *
 * BlobMorph still needs the continuous value, so it subscribes to the
 * MotionValue itself (its physics loop already runs outside React).
 */
export function useLatchedKeyResolved(source: MotionValue<number>): boolean {
  const [resolved, setResolved] = useState(() => source.get() >= KEY_RIGID_PROGRESS);
  const latchedRef = useRef(resolved);

  useEffect(() => {
    /* Re-check on (re)subscribe: the MotionValue may already have passed the
       threshold while this effect was torn down and rebuilt. */
    if (latchedRef.current) return;
    if (source.get() >= KEY_RIGID_PROGRESS) {
      latchedRef.current = true;
      setResolved(true);
      return;
    }
    return source.on("change", (latest) => {
      if (latchedRef.current || latest < KEY_RIGID_PROGRESS) return;
      latchedRef.current = true;
      setResolved(true);
    });
  }, [source]);

  return latchedRef.current;
}