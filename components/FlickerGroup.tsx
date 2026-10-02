"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
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

/* onceKeys whose flicker has already played this page load. The mobile panel
   unmounts its article on every beat swap (AnimatePresence key={beat.id}), so
   without this the flicker would replay on every revisit. All groups sharing an
   onceKey count as one unit — one key per beat staggers that beat on first
   view and leaves every group in it revealed from then on. */
const revealedOnceKeys = new Set<string>();

interface FlickerGroupProps {
  children: React.ReactNode;
  /** Optional group id for deterministic seeding across renders. */
  groupId?: string;
  className?: string;
  /** Fraction of the element that must be visible before revealing. */
  revealThreshold?: number;
  /** Reveal as soon as the group mounts, skipping IntersectionObserver.
   *  Correct wherever the container is already on screen — notably the fixed
   *  mobile panel, whose groups are often `display: contents` wrappers and so
   *  generate no box for an IntersectionObserver to observe. */
  revealOnMount?: boolean;
  /** Remember this reveal across unmount/remount for the rest of the page
   *  load. Groups sharing a key share the memory. */
  onceKey?: string;
  /** Element for the group wrapper (default "div"). Lets the wrapper be the
   *  semantic container — `as="ul"` with `childAs="li"` keeps list items owned
   *  by their list while each still gets its own delay. */
  as?: React.ElementType;
  /** Element for each per-child wrapper (default "div"). */
  childAs?: React.ElementType;
}

const FLICKER_DURATION = 400; // ms, matches flicker-in keyframe
const FIRST_DELAY = 700; // ms, no child starts before this
const WINDOW_END = 2000; // ms, all must finish by this (incl. FIRST_DELAY)
/* No timeout backs this up, deliberately. On desktop every section mounts at
   once and each group waits off-screen for the observer, so a blanket
   "reveal anyway" timer would expose the whole page a few seconds after load
   and rob the scroll of the flicker. Groups that can't be observed — the
   boxless `display: contents` wrappers in the mobile panel — opt into
   revealOnMount instead, where the mount itself is the trigger. */

export function FlickerGroup({
  children,
  groupId,
  className,
  revealThreshold = 0.5,
  revealOnMount = false,
  onceKey,
  as,
  childAs,
}: FlickerGroupProps) {
  const { isReducedMotion, isLoading } = useApp();
  const ref = useRef<HTMLElement>(null);
  /* `settled` is true when this group already revealed in an earlier mount —
     the onceKey memory. It has to render at the animation's end state with no
     animation at all: `forwards` only fills after the animation finishes, so
     during the delay a running animation still shows the declared opacity 0.
     Starting one here would blank the copy and then replay the flicker. */
  const [settled] = useState(
    () => onceKey !== undefined && revealedOnceKeys.has(onceKey),
  );
  const [revealed, setRevealed] = useState(settled);

  const reveal = useCallback(() => {
    setRevealed(true);
    if (onceKey !== undefined) revealedOnceKeys.add(onceKey);
  }, [onceKey]);

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
      reveal();
      return;
    }
    /* The loading gate comes first on purpose: a group mounted behind the
       LoadingScreen must spend its flicker after it clears, not during. */
    if (isLoading || revealed) return;
    if (revealOnMount) {
      reveal();
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: revealThreshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isReducedMotion, isLoading, reveal, revealOnMount, revealed, revealThreshold]);

  const Wrapper = (as ?? "div") as React.ElementType<{
    className?: string;
    ref?: React.Ref<HTMLElement>;
  }>;
  const Child = (childAs ?? "div") as React.ElementType<{
    className?: string;
    style?: React.CSSProperties;
  }>;

  return (
    <Wrapper ref={ref} className={"flicker-group " + className}>
      {childArray.map((child, index) => {
        const delay = childDelays[index] ?? FIRST_DELAY;
        return (
          <Child
            key={child.key ?? index}
            className="flicker-child"
            style={
              settled
                ? { animation: "none", opacity: 1 }
                : {
                    /* Delay counts from the reveal instant, not from mount — a
                       late observer would otherwise burn the stagger and drop
                       children straight to their end state. Paused at 0% they
                       are opacity 0 either way, so nothing changes before the
                       reveal. */
                    animationDelay: revealed ? `${delay}ms` : "0ms",
                    animationPlayState: revealed ? "running" : "paused",
                  }
            }
          >
            {child}
          </Child>
        );
      })}
    </Wrapper>
  );
}
