"use client";

/**
 * HackTVM'26 — Access Point
 * KeycapGlow — the chromatic bleed on the resolved "H" keycap.
 *
 * Light spill, not a halo: two blurred copies of the keycap's own alpha sit
 * just OUTSIDE its silhouette and screen additively — violet escaping past the
 * bottom-left edge, blue past the opposite top-right edge. The crisp keycap is
 * NOT drawn here: it is BlobMorph's own <image>, still in the SVG, so the
 * bleed is composed behind the sharp key and is aligned with it by
 * construction (both read the same rect BlobMorph publishes via onKeyRect).
 *
 * Layer stack, bottom to top:
 *   .keycap-glow-spill (violet)  blur + screen, offset past the bottom-left
 *   .keycap-glow-spill (blue)    blur + screen, offset past the top-right
 *   BlobMorph's <svg>            black silhouette (fading out) + crisp keycap
 *
 * Every filter here is STATIC, declared once in globals.css, on a layer that
 * only ever receives `transform`. A filter is rastered into the layer's own
 * texture and a transform just moves that texture, so the blur is never
 * recomputed while the glow drifts. Nothing animates top/left/width/height.
 *
 * Drivers (see hooks/useGlowDriver.ts) are interchangeable — the component only
 * consumes a normalized {x, y}:
 *   fine pointer  — one window mousemove, rAF-coalesced, purple tracks
 *                   -vector and blue +vector so the two visibly separate as the
 *                   cursor moves off-centre.
 *   coarse/touch  — CSS @keyframes on two different periods (7s / 9s) with a
 *                   phase offset, so the layers drift asynchronously and no JS
 *                   runs per frame at all.
 *
 * The driver is only attached while the key is resolved (progress has reached
 * KEY_RIGID_PROGRESS), so none of this is alive for the rest of the journey.
 */
import type { CSSProperties } from "react";
import { KEY_RIGID_PROGRESS, KEY_VIEWBOX_UNITS, type KeyVisualRect } from "@/components/BlobMorph";
import { useApp } from "@/context/AppContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAmbientGlow, useCursorGlow } from "@/hooks/useGlowDriver";

/** Keycap alpha used as the mask for both tinted layers. Same asset the SVG
 *  <image> draws, so the spill is shaped by the real key and not a stand-in. */
const KEY_IMAGE_SRC = "/keycap.png";

/** Blur radius of the spill, in CSS px. Per the filter spec blur() is a
 *  Gaussian with this as its standard deviation, so it spreads a little past
 *  it on EVERY side — the offset below is what unbalances that. */
const GLOW_BLUR_PX = 20;

/** Resting offset of each spill past its own edge, in px: violet -x/+y
 *  (bottom-left), blue +x/-y (top-right).
 *
 *  This is the knob that makes the bleed read as one-sided. The further the
 *  blurred copy is pushed off the silhouette, the more of its spread is hidden
 *  under the sharp keycap, leaving only the escape corner showing. Kept at
 *  ~1.5x the blur radius: at parity the far side still carries roughly half the
 *  peak density, at 1.5x it has decayed to a faint fringe. */
const BASE_BLEED_X_PX = 30;
const BASE_BLEED_Y_PX = 32;

/** How far each blurred slot is inflated past the key box. Pure headroom: a
 *  filter's result is clipped to its own border box, so this has to exceed the
 *  blur's reach (~2.4 sigma) or the spill gets a visible straight cut where the
 *  box ends. The tint inside is inset by the same amount, so this moves
 *  nothing — it only buys the blur room to decay in. */
const BLEED_PX = 48;

/** The mobile blob is min(78vw, 38dvh) (see --blob-size in globals.css) —
 *  roughly 0.35x to 0.5x the 680px desktop box. Every px above is scaled by
 *  this on compact viewports so the spill keeps the same weight relative to the
 *  keycap rather than swamping it, blur-to-offset ratio included. */
const MOBILE_BLEED_SCALE = 0.5;

/** Max cursor-driven travel, in px. Deliberately small — this is a drifting
 *  bloom, not a draggable element. */
const CURSOR_DRIVE_PX = 16;

/** Ambient drift amplitude (px) and the two periods/phase offsets that keep the
 *  layers from moving in lockstep. */
const AMBIENT_AMP_PX = 8;
const AMBIENT_DUR_VIOLET = "7s";
const AMBIENT_DUR_BLUE = "9s";
const AMBIENT_DELAY_VIOLET = "0s";
const AMBIENT_DELAY_BLUE = "-2.6s";

/** How long the bloom takes to come up once the key is fully resolved. */
const FADE_IN_MS = 600;

interface KeycapGlowProps {
  /** Same progress value fed to BlobMorph. */
  progress: number;
  /** The resolved keycap's box, published by BlobMorph. Null until the
   *  silhouette has been sampled — nothing renders without it. */
  rect: KeyVisualRect | null;
}

type Side = "violet" | "blue";

function translate(x: number, y: number): string {
  return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}

export function KeycapGlow({ progress, rect }: KeycapGlowProps) {
  const { isReducedMotion } = useApp();

  /* No fine pointer (or reduced motion) → CSS owns the transform, JS stays out. */
  const hasFinePointer = useMediaQuery("(pointer: fine)");
  const ambient = !hasFinePointer || isReducedMotion;

  /* Same breakpoint that switches --blob-size to the viewport-sized value, so
     the spill scales exactly when the keycap it hugs does. */
  const isCompact = useMediaQuery("(max-width: 767px)");
  const k = isCompact ? MOBILE_BLEED_SCALE : 1;
  const blurPx = GLOW_BLUR_PX * k;
  const bleedPx = BLEED_PX * k;
  const baseX = BASE_BLEED_X_PX * k;
  const baseY = BASE_BLEED_Y_PX * k;
  const drivePx = CURSOR_DRIVE_PX * k;
  const ambientAmp = AMBIENT_AMP_PX * k;

  /* Both drivers are called unconditionally; the unused one is inert. */
  const isActive = progress >= KEY_RIGID_PROGRESS;
  const cursor = useCursorGlow(isActive && !ambient);
  const ambientVector = useAmbientGlow();
  const vector = ambient ? ambientVector : cursor;

  if (!rect) return null;

  /* The SVG's viewBox maps 1:1 onto its --blob-size box (it is square, and the
     default xMidYMid meet adds no letterbox), so viewBox units become plain
     percentages of this equally-sized wrapper — no measuring, no breakpoints. */
  const anchor: CSSProperties = {
    left: `${(rect.x / KEY_VIEWBOX_UNITS) * 100}%`,
    top: `${(rect.y / KEY_VIEWBOX_UNITS) * 100}%`,
    width: `${(rect.width / KEY_VIEWBOX_UNITS) * 100}%`,
    height: `${(rect.height / KEY_VIEWBOX_UNITS) * 100}%`,
  };

  /* Opposite corners: violet pushes out to the bottom-left, blue to the
     top-right, and the cursor drives them in exact opposition so they separate
     as it leaves centre. */
  const offsets: Record<Side, { x: number; y: number }> = {
    violet: {
      x: -baseX - vector.x * drivePx,
      y: baseY - vector.y * drivePx,
    },
    blue: {
      x: baseX + vector.x * drivePx,
      y: -baseY + vector.y * drivePx,
    },
  };

  const ambientVars: Record<Side, CSSProperties> = {
    violet: {
      "--glow-base-x": `${-baseX}px`,
      "--glow-base-y": `${baseY}px`,
      "--glow-amp": `${ambientAmp}px`,
      "--glow-dur": AMBIENT_DUR_VIOLET,
      "--glow-delay": AMBIENT_DELAY_VIOLET,
    },
    blue: {
      "--glow-base-x": `${baseX}px`,
      "--glow-base-y": `${-baseY}px`,
      "--glow-amp": `${ambientAmp}px`,
      "--glow-dur": AMBIENT_DUR_BLUE,
      "--glow-delay": AMBIENT_DELAY_BLUE,
    },
  };

  const spill = (side: Side) => (
    /* Anchor: the keycap's own box. Sits in the same grid cell as BlobMorph's
       svg, so it overlays the key exactly. */
    <div key={side} className="absolute" style={anchor}>
      {/* Blur + blend + will-change live here, in CSS, and never change — only
          the inline transform does. This element is inflated by BLEED_PX so the
          blur has somewhere to go; the tint inside is inset back by the same
          amount, landing precisely on the keycap's box. */}
      <div
        className={[
          "keycap-glow-spill absolute",
          ambient ? "keycap-glow-drift" : "",
          side === "violet" ? "keycap-glow-violet" : "keycap-glow-blue",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          ambient
            ? (ambientVars[side] as CSSProperties)
            : { transform: translate(offsets[side].x, offsets[side].y) }
        }
      >
        {/* The tint: a flat colour clipped to the keycap's alpha. */}
        <div className="keycap-glow-tint" />
      </div>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="relative h-[var(--blob-size)] w-[var(--blob-size)] pointer-events-none"
      style={
        {
          opacity: isActive ? 1 : 0,
          transition: isReducedMotion
            ? undefined
            : `opacity ${FADE_IN_MS}ms ease-out`,
          "--glow-mask": `url(${KEY_IMAGE_SRC})`,
          "--glow-blur": `${blurPx}px`,
          "--glow-bleed": `${bleedPx}px`,
        } as CSSProperties
      }
    >
      {spill("violet")}
      {spill("blue")}
    </div>
  );
}
