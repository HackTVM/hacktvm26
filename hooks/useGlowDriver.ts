/**
 * HackTVM'26 — Access Point
 * useGlowDriver — interchangeable drivers for the keycap's chromatic bleed.
 *
 * Both drivers resolve to the same tiny value: the ANGLE of the pointer around
 * the keycap, in radians — i.e. where the cursor sits *around* the key, not how
 * far it is *from* it. KeycapGlow is the only consumer, and it is the only thing
 * that turns an angle into the two layers' transforms — so swapping drivers
 * never touches the visuals.
 *
 * The distinction is the whole point. An earlier version reported a normalized
 * {x, y} and the layers translated along it, which slid the spill radially and
 * let it pull away from the keycap's edge as the cursor moved outward. Orbiting
 * keeps |offset| constant by construction: the offset vector is never scaled,
 * only rotated, so the spill can travel around the keycap but never off it.
 *
 *  - useCursorGlow  — desktop. ONE window-level mousemove listener, coalesced
 *    through requestAnimationFrame so React state changes at most once per
 *    frame. rAF id is captured in a ref and reused, so a burst of moves inside
 *    one frame schedules a single flush. The angle is smoothed toward the
 *    target along the shortest arc each frame, which is what keeps a drifting
 *    bloom from reading as jitter.
 *
 *  - useAmbientGlow — touch/coarse-pointer. There is no cursor to react to, so
 *    the time-based driver deliberately runs ZERO JS: KeycapGlow hands the
 *    transform to a CSS @keyframes animation instead (compositor-driven, no
 *    per-frame script). This hook therefore always reports null; it exists so
 *    the "which driver am I?" decision has one obvious answer at the call site
 *    rather than a scattered boolean.
 *
 * Both report `null` to mean "no usable reading — hold the resting pose", which
 * is deliberately distinct from an angle of 0 (a real reading, pointing right).
 * Callers must not treat null as zero.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Keycap centre in viewport px, or null if it cannot be measured. */
export type KeyCenter = { x: number; y: number } | null;

/** Lazily reads the keycap's current viewport centre. */
export type GetKeyCenter = () => KeyCenter;

/** Radius around the keycap centre within which the angle is ignored. Wide
 *  enough that resting the cursor on the key reads as "no input" rather than
 *  chasing sub-pixel jitter. */
const DEADZONE_PX = 40;

/** Fraction of the remaining arc covered per frame. Frame-rate dependent by
 *  design — it is a per-frame lerp, not a time-based one — but at any normal
 *  refresh rate this lands a ~100ms settle, which is the feel of a bloom
 *  rather than a cursor follower. */
const SMOOTHING = 0.12;

/** Signed shortest distance from `from` to `to`, in -PI..PI. */
function shortestArc(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/**
 * Cursor driver. Reports the smoothed angle of the pointer around the keycap.
 *
 * @param active should only be true while the resolved keycap is actually on
 *   screen — the listener is attached on the rising edge and torn down on the
 *   falling one, so this costs nothing for the rest of the journey. Reduced
 *   motion opts out entirely: the caller passes `false`, and the hook reports
 *   null so the layers hold their resting offset.
 * @param getKeyCenter resolves the pivot to orbit around. A getter rather than
 *   a measured value so scrolling and resizing stay correct without the driver
 *   subscribing to either.
 */
export function useCursorGlow(active: boolean, getKeyCenter: GetKeyCenter): number | null {
  /* Returns a plain boolean, NOT an object — destructuring it would silently
     yield undefined and quietly disable the reduced-motion opt-out below. */
  const isReducedMotion = useReducedMotion();
  const enabled = active && !isReducedMotion;

  const [angle, setAngle] = useState<number | null>(null);
  const targetRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  /* Read through a ref so a new getKeyCenter identity (the consumer recreates
     it whenever the keycap rect changes) never tears down and re-attaches the
     window listener. */
  const centerRef = useRef(getKeyCenter);
  centerRef.current = getKeyCenter;

  useEffect(() => {
    /* Disabled (or disabled again): drop the pending target so re-enabling never
       resumes from a stale reading, and drop any in-flight frame. The rendered
       value is gated on `enabled` below, so no setState is needed here — the
       first move after re-enabling refreshes it. */
    if (!enabled) {
      targetRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      return;
    }

    /* Eased toward the target along the shortest arc, then re-armed for the
       next frame. Re-arming here (rather than only on mousemove) is what carries
       the easing to rest after the pointer stops. */
    let current: number | null = null;
    const step = () => {
      const target = targetRef.current;
      if (target === null || current === null) {
        current = target;
        setAngle(current);
        frameRef.current = 0;
        return;
      }
      const delta = shortestArc(current, target);
      if (Math.abs(delta) < 1e-4) {
        current = target;
        setAngle(current);
        frameRef.current = 0;
        return;
      }
      current += delta * SMOOTHING;
      setAngle(current);
      frameRef.current = requestAnimationFrame(step);
    };

    const onMove = (e: MouseEvent) => {
      const center = centerRef.current();
      if (!center) return;

      const dx = e.clientX - center.x;
      const dy = e.clientY - center.y;

      /* Inside the deadzone the angle is numerically unstable and would spin the
         layers as the cursor jitters around the pivot. Hold the last reading by
         returning without touching the target — `step` keeps easing to it. */
      if (dx * dx + dy * dy < DEADZONE_PX * DEADZONE_PX) return;

      targetRef.current = Math.atan2(dy, dx);
      if (!frameRef.current) frameRef.current = requestAnimationFrame(step);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [enabled]);

  return enabled ? angle : null;
}

/**
 * Ambient (time-based) driver. Intentionally inert — the drift is a CSS
 * animation, so there is nothing for JavaScript to report every frame. Kept as
 * a hook so KeycapGlow's driver swap is a one-line choice and the two drivers
 * share a return type.
 */
export function useAmbientGlow(): number | null {
  return null;
}
