/**
 * HackTVM'26 — Access Point
 * useGlowDriver — interchangeable drivers for the keycap's chromatic bleed.
 *
 * Both drivers resolve to the same tiny value: a normalized { x, y } vector in
 * -1..1 on each axis (viewport centre = origin). KeycapGlow is the only
 * consumer, and it is the only thing that knows how to turn a vector into the
 * two opposing layer offsets — so swapping drivers never touches the visuals.
 *
 *  - useCursorGlow  — desktop. ONE window-level mousemove listener, coalesced
 *    through requestAnimationFrame so React state changes at most once per
 *    frame. rAF id is captured in a ref and reused, so a burst of moves inside
 *    one frame schedules a single flush.
 *
 *  - useAmbientGlow — touch/coarse-pointer. There is no cursor to react to, so
 *    the time-based driver deliberately runs ZERO JS: KeycapGlow hands the
 *    transform to a CSS @keyframes animation instead (compositor-driven, no
 *    per-frame script). This hook therefore always reports the zero vector; it
 *    exists so the "which driver am I?" decision has one obvious answer at the
 *    call site rather than a scattered boolean.
 *
 * The zero vector is a frozen singleton so React can bail out of re-renders
 * when nothing is moving.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Normalized pointer/oscillator position: -1..1 per axis, centred on 0. */
export interface GlowVector {
  x: number;
  y: number;
}

/** Frozen identity vector — safe to share as a default return value. */
const ZERO: GlowVector = Object.freeze({ x: 0, y: 0 });

function clampUnit(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

/**
 * Cursor driver. `active` should only be true while the resolved keycap is
 * actually on screen — the listener is attached on the rising edge and torn
 * down on the falling one, so this costs nothing for the rest of the journey.
 * Reduced motion opts out entirely: the caller passes `false`, and the hook
 * reports the zero vector so the layers hold their resting offset.
 */
export function useCursorGlow(active: boolean): GlowVector {
  const { isReducedMotion } = useReducedMotion();
  const enabled = active && !isReducedMotion;

  const [vector, setVector] = useState<GlowVector>(ZERO);
  const targetRef = useRef<GlowVector>(ZERO);
  const frameRef = useRef(0);

  useEffect(() => {
    /* Disabled (or disabled again): drop the pending target so re-enabling
       never resumes from a stale position, and drop any in-flight frame. The
       rendered value is gated on `enabled` below, so no setState is needed
       here — the first move after re-enabling refreshes it. */
    if (!enabled) {
      targetRef.current = ZERO;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      return;
    }

    const flush = () => {
      frameRef.current = 0;
      const next = targetRef.current;
      setVector((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    };

    const onMove = (e: MouseEvent) => {
      targetRef.current = {
        x: clampUnit((e.clientX / window.innerWidth) * 2 - 1),
        y: clampUnit((e.clientY / window.innerHeight) * 2 - 1),
      };
      /* At most one scheduled flush per frame: the id is truthy exactly while
         a flush is pending. */
      if (!frameRef.current) frameRef.current = requestAnimationFrame(flush);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [enabled]);

  return enabled ? vector : ZERO;
}

/**
 * Ambient (time-based) driver. Intentionally inert — the drift is a CSS
 * animation, so there is nothing for JavaScript to report every frame. Kept as
 * a hook so KeycapGlow's driver swap is a one-line choice and the two drivers
 * share a return type.
 */
export function useAmbientGlow(): GlowVector {
  return ZERO;
}
