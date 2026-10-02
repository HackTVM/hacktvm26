"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * HackTVM'26 — Access Point
 * Shared blob stage — the fixed, centered container that the persistent blob
 * and the key hit-area both render inside so they always stay aligned.
 *
 * Sizing comes from CSS (--blob-size, which is fluid per breakpoint) and
 * repositioning from the `className` prop — mobile passes `mobile-stage`, which
 * globals.css retargets into the top 40% band via top/height/bottom. Children
 * inherit the resulting box, so the hit-area tracks the blob with no JS.
 *
 * Children are STACKED in a single centered grid cell — NOT laid out side by
 * side (a flex row used to push the blob left and the key hit-area right).
 * Every child (`BlobMorph`'s svg, `KeyHitArea`'s overlay box) occupies the
 * same 1/1 cell and is centered via `place-items-center`, so they always
 * overlap exactly regardless of their individual sizes.
 */
interface BlobStageProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function BlobStage({ className = "", style, children }: BlobStageProps) {
  return (
    <div
      className={`fixed inset-0 z-10 pointer-events-none grid place-items-center [&>*]:[grid-area:1/1] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}