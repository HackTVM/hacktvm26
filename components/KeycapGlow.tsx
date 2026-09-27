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
 * consumes an angle:
 *   fine pointer  — one window mousemove, rAF-coalesced and eased, giving the
 *                   angle of the cursor AROUND the keycap. The spill orbits that
 *                   angle, so it travels around the key and its distance from
 *                   the keycap edge never changes.
 *   coarse/touch  — CSS @keyframes on two different periods (7s / 9s) with a
 *                   phase offset, swinging the same offset vector by a few
 *                   degrees, so the layers drift asynchronously and no JS runs
 *                   per frame at all.
 *
 * The cursor therefore reacts to WHERE it is around the key, not how far away
 * it is: the offset vector is only ever rotated, never scaled or translated
 * along, which makes "the gradient moves away from the keycap" structurally
 * impossible rather than merely tuned against.
 *
 * The driver is only attached while the key is resolved (progress has reached
 * KEY_RIGID_PROGRESS), so none of this is alive for the rest of the journey.
 */
import type { CSSProperties } from "react";
import { useCallback, useRef } from "react";
import { KEY_RIGID_PROGRESS, KEY_VIEWBOX_UNITS, type KeyVisualRect } from "@/components/BlobMorph";
import { useApp } from "@/context/AppContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  useAmbientGlow,
  useCursorGlow,
  type KeyCenter,
} from "@/hooks/useGlowDriver";

/** Keycap alpha used as the mask for both tinted layers. Same asset the SVG
 *  <image> draws, so the spill is shaped by the real key and not a stand-in. */
const KEY_IMAGE_SRC = "/keycap.png";

/** Blur radius of the spill, in CSS px. Per the filter spec blur() is a
 *  Gaussian with this as its standard deviation, so it spreads a little past
 *  it on EVERY side — the offset below is what unbalances that. */
/** Blur sigma, px. Tightened alongside the offset below: a smaller sigma
 *  concentrates the same flux into a smaller area, so the spill reads denser
 *  where it meets the keycap. That is what lets the offset come IN without the
 *  escape side going faint — pulling the offset in on its own would trade
 *  closeness for brightness, since a blur displaced less far from its source
 *  splits more evenly across the feather. */
const GLOW_BLUR_PX = 15;

/** Resting offset of each spill past its own edge, in px: violet -x/+y
 *  (bottom-left), blue +x/-y (top-right).
 *
 *  This is a DIRECTION, not a magnitude the driver may scale: the layers orbit
 *  by rotating this vector, so its length is invariant and the spill can only
 *  ever travel AROUND the keycap, never further from it. See the transform note
 *  below.
 *
 *  Well clear of zero on purpose. At zero offset the blur would be perfectly
 *  symmetric and the spill would read as a uniform halo all the way round,
 *  which is the one thing the directional feather and this offset exist to
 *  prevent — so the floor is set by how asymmetric the bleed has to stay, not
 *  by how close it looks. */
const BASE_BLEED_X_PX = 14;
const BASE_BLEED_Y_PX = 15;

/** The offset's resting angle, in radians, with screen axes (y down).
 *  Atan2 of (-x, +y) puts violet at the bottom-left; blue's is its negation,
 *  exactly opposite at the top-right.
 *
 *  The ORBIT is referenced from BLUE's angle, not violet's. The orbit is what
 *  decides which way a layer faces, so referencing blue's rest is what makes
 *  blue lean toward the cursor while violet leans away — referencing violet's
 *  (the intuitive choice, being the primary) inverts exactly that relationship,
 *  and it is not something the eye would catch as a bug rather than as a look. */
const BLUE_REST_ANGLE = Math.atan2(-BASE_BLEED_Y_PX, BASE_BLEED_X_PX);

/** Strength multiplier applied to both tints. Blur spreads a fixed amount of
 *  energy over a growing area, so a bleed that reads correctly at the keycap's
 *  edge thins out fast as it travels; this restores the density the spill
 *  loses along the arc.
 *
 *  Kept modest. The tints themselves were raised to compensate for thinness —
 *  pushing this higher instead drives the highlights to clip, and a clipped
 *  `screen`-blended channel is just white, which desaturates the very colour
 *  this is meant to strengthen. */
const TINT_STRENGTH = 1.25;

/** How far each blurred slot is inflated past the key box. Pure headroom: a
 *  filter's result is clipped to its own border box, so this has to exceed the
 *  blur's reach (~2.4 sigma) or the spill gets a visible straight cut where the
 *  box ends. The tint inside is inset by the same amount, so this moves
 *  nothing — it only buys the blur room to decay in.
 *
 *  This is the one px value that must scale with the keycap: it is headroom for
 *  a blur whose radius is in px, so on the smaller mobile blob both are scaled
 *  together (see MOBILE_BLEED_SCALE) or the spill would clip. The orbit offset
 *  below does NOT need it — it is expressed as a rotation, so it is inherently
 *  relative to the keycap and stays correct at any size. */
const BLEED_PX = 48;

/** The mobile blob is min(78vw, 38dvh) (see --blob-size in globals.css) —
 *  roughly 0.35x to 0.5x the 680px desktop box. Scales the blur and its
 *  headroom together so the spill keeps the same weight relative to the
 *  keycap rather than swamping it, blur-to-headroom ratio included. */
const MOBILE_BLEED_SCALE = 0.5;

/** Ambient drift amplitude, in DEGREES of orbit (not px of travel — the ambient
 *  driver swings the same fixed-length offset vector around the keycap, for the
 *  same reason the cursor does). Two periods and a phase offset between them
 *  keep the layers from moving in lockstep. */
const AMBIENT_AMP_DEG = 10;
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

export function KeycapGlow({ progress, rect }: KeycapGlowProps) {
  const { isReducedMotion } = useApp();

  /* No fine pointer (or reduced motion) → CSS owns the transform, JS stays out. */
  const hasFinePointer = useMediaQuery("(pointer: fine)");
  const ambient = !hasFinePointer || isReducedMotion;

  /* Same breakpoint that switches --blob-size to the viewport-sized value, so
     the blur scales exactly when the keycap it hugs does. Only the blur and its
     headroom — the offset is an angle and needs no scaling. */
  const isCompact = useMediaQuery("(max-width: 767px)");
  const k = isCompact ? MOBILE_BLEED_SCALE : 1;
  const blurPx = GLOW_BLUR_PX * k;
  const bleedPx = BLEED_PX * k;

  /* Measured lazily, never stored: the driver only needs it on a mousemove, and
     reading it here would force a layout on every render.
     The pivot is the KEYCAP's centre, not the blob's — the keycap sits at
     52.43% / 48.92% of the blob box, so the two are meaningfully different and
     orbiting around the blob centre would make the spill swing wide on the
     side the keycap is off-centre. The root element maps 1:1 onto the SVG's
     viewBox, so the keycap's rect converts straight to a fraction of it. */
  const rootRef = useRef<HTMLDivElement>(null);
  const getKeyCenter = useCallback((): KeyCenter => {
    const el = rootRef.current;
    if (!el || !rect) return null;
    const box = el.getBoundingClientRect();
    return {
      x: box.left + ((rect.x + rect.width / 2) / KEY_VIEWBOX_UNITS) * box.width,
      y: box.top + ((rect.y + rect.height / 2) / KEY_VIEWBOX_UNITS) * box.height,
    };
  }, [rect]);

  /* Both drivers are called unconditionally; the unused one is inert. */
  const isActive = progress >= KEY_RIGID_PROGRESS;
  const cursorAngle = useCursorGlow(isActive && !ambient, getKeyCenter);
  const ambientAngle = useAmbientGlow();
  const angle = ambient ? ambientAngle : cursorAngle;

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

  /* ORBIT, not travel.
     ONE rotation drives both layers. They are antiparallel at rest, so
     rotating them by a shared angle keeps them exactly opposite at every point
     of the swing — clamping each side independently against its own rest angle
     would let them converge as one ran into its limit and the other had not.
     Only the ANGLE changes, so the offset vector's length is invariant: the
     gradients move around the keycap and can never move away from it. */
  const orbitDeg = (): number => {
    if (angle === null) return 0;
    /* Shortest-arc, so crossing the +/-PI seam doesn't spin the layer a full
       turn. Referenced from BLUE's rest angle so the blue spill faces the
       cursor and the violet one, being its negation, faces away. */
    const wrapped = Math.atan2(
      Math.sin(angle - BLUE_REST_ANGLE),
      Math.cos(angle - BLUE_REST_ANGLE),
    );
    const deg = (wrapped * 180) / Math.PI;
    /* No clamp: the layers track the cursor all the way around rather than
       pinning to a stop. An earlier build capped the swing at 34° against a
       fixed rest angle, which froze the response across most of the screen —
       the spill only varied inside a narrow wedge and read as broken
       everywhere else. Bounding is unnecessary anyway, since shortest-arc
       wrapping above already lands within +/-180°, the offset vector is only
       ever rotated (never lengthened), and both layers share that one angle.
       So the swing can't move either layer away from the keycap, and can't
       bring them into collision, at any point of the sweep. */
    return deg;
  };

  /* rotate() then translate3d(): the rotation is about the layer's own centre,
     which coincides with the keycap's centre, so the offset vector is swung
     around that point at fixed length. Ordering matters — translating first
     would slide the layer along the rotated axis and reintroduce exactly the
     radial drift this replaced. */
  const transform = (side: Side): string => {
    const sign = side === "violet" ? 1 : -1;
    const x = -BASE_BLEED_X_PX * sign;
    const y = BASE_BLEED_Y_PX * sign;
    return `rotate(${orbitDeg().toFixed(2)}deg) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };

  /* Custom properties aren't in React's CSSProperties type, hence the casts.
     Both sides share one --glow-orbit (the pair's shared rest axis) and differ
     only in the sign of their offset, matching the cursor driver's single
     shared rotation — so the keyframes keep them exactly opposite too. */
  const ambientVars: Record<Side, CSSProperties> = {
    violet: {
      "--glow-base-x": `${-BASE_BLEED_X_PX}px`,
      "--glow-base-y": `${BASE_BLEED_Y_PX}px`,
      "--glow-orbit": `${BLUE_REST_ANGLE}rad`,
      "--glow-amp": `${AMBIENT_AMP_DEG}deg`,
      "--glow-dur": AMBIENT_DUR_VIOLET,
      "--glow-delay": AMBIENT_DELAY_VIOLET,
    } as CSSProperties,
    blue: {
      "--glow-base-x": `${BASE_BLEED_X_PX}px`,
      "--glow-base-y": `${-BASE_BLEED_Y_PX}px`,
      "--glow-orbit": `${BLUE_REST_ANGLE}rad`,
      "--glow-amp": `${AMBIENT_AMP_DEG}deg`,
      "--glow-dur": AMBIENT_DUR_BLUE,
      "--glow-delay": AMBIENT_DELAY_BLUE,
    } as CSSProperties,
  };

  /* Where the directional cut lands along each spill's diagonal, as a
     percentage of the layer box. Both layers share the same numbers (the CSS
     defaults), stated here so the geometry is tuned next to the blur and
     offsets it has to stay inside. Measured from the escape corner, so the
     cut happens just inside the keycap's own edge: 56% of the way along the
     diagonal is still under the sharp key, and the ramp to 80% stays under it
     too, so neither the cut nor the blur softening it is ever on top.

     The mask rides along with the layer as it orbits, so these stay valid at
     every angle — the keycap's edge remains under the ramp across the whole
     +/-34deg swing, because the keycap is near-square (364x312) relative to
     the layer it sits in. */
  const featherVars = {
    "--glow-feather-hold": "56%",
    "--glow-feather-ramp": "80%",
  } as CSSProperties;

  const spill = (side: Side) => (
    /* Anchor: the keycap's own box. Sits in the same grid cell as BlobMorph's
       svg, so it overlays the key exactly. */
    <div key={side} className="absolute" style={anchor}>
      {/* Blur + blend + will-change live here, in CSS, and never change — only
          the inline transform does. This element is inflated by BLEED_PX so the
          blur has somewhere to go; the tint inside is inset back by the same
          amount, landing precisely on the keycap's box. The directional feather
          mask also lives here, on the blurred result, so it takes the non-escape
          side to exactly zero. */}
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
            ? { ...ambientVars[side], ...featherVars }
            : { transform: transform(side), ...featherVars }
        }
      >
        {/* The tint: a flat colour clipped to the keycap's alpha. */}
        <div className="keycap-glow-tint" />
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
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
          "--glow-strength": String(TINT_STRENGTH),
        } as CSSProperties
      }
    >
      {spill("violet")}
      {spill("blue")}
    </div>
  );
}
