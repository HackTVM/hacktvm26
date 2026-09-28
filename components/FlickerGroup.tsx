"use client";

import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import { useApp } from "@/context/AppContext";

/* FNV-1a hash → uint32 seed for the PRNG. Deterministic across renders. */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* mulberry32 — tiny seeded PRNG; stable per seed, never re-randomized. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FlickerGroupProps {
  children: React.ReactNode;
  /** Optional group id for deterministic seeding across renders. */
  groupId?: string;
  className?: string;
  /** Fraction of the element that must be visible before revealing. */
  revealThreshold?: number;
}

const FLICKER_DURATION = 400; // ms, matches flicker-in keyframe
const FIRST_DELAY = 700; // ms, no child starts before this
const WINDOW_END = 2000; // ms, all must finish by this (incl. FIRST_DELAY)

export function FlickerGroup({
  children,
  groupId,
  className,
  revealThreshold = 0.5,
}: FlickerGroupProps) {
  const { isReducedMotion, isLoading } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  const childArray = useMemo(() => {
    const childArr = React.Children.toArray(children);
    return childArr.filter((child): child is React.ReactElement => React.isValidElement(child));
  }, [children]);

  const stableGroupId = useId();
  const seedBase = useMemo(() => {
    const id = groupId ?? stableGroupId;
    return hashSeed(id);
  }, [groupId, stableGroupId]);

  const childDelays = useMemo(() => {
    const rand = mulberry32(seedBase);
    const count = childArray.length;
    if (count === 0) return [];

    const windowSize = WINDOW_END - FIRST_DELAY - FLICKER_DURATION;
    if (count === 1) {
      return [FIRST_DELAY + windowSize / 2];
    }

    // Generate positions with jitter
    const positions = Array.from({ length: count }, (_, i) => {
      const base = (i / (count - 1)) * windowSize;
      const jitter = (rand() - 0.5) * (windowSize / (count * 2));
      return Math.max(0, Math.min(windowSize, base + jitter));
    });

    // Shuffle positions for truly random assignment
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return positions.map((p) => FIRST_DELAY + p);
  }, [seedBase, childArray.length]);

  useEffect(() => {
    if (isReducedMotion) {
      setRevealed(true);
      return;
    }
    if (isLoading || revealed) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: revealThreshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isReducedMotion, isLoading, revealed, revealThreshold]);

  return (
    <div ref={ref} className={"flicker-group " + className}>
      {childArray.map((child, index) => {
        const delay = childDelays[index] ?? FIRST_DELAY;
        return (
          <div
            key={child.key ?? index}
            className="flicker-child"
            style={{
              animationDelay: `${delay}ms`,
              animationPlayState: revealed ? "running" : "paused",
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
