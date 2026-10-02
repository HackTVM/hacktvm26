import { useCallback, useEffect, useRef, useState } from "react";
import { BlobMorph } from "@/components/BlobMorph";
import { BlobStage } from "@/components/BlobStage";
import { KeyHitArea } from "@/components/KeyHitArea";
import { MobileBeatPanel } from "@/components/mobile/MobileBeatPanel";
import { MobileScrollCue } from "@/components/mobile/MobileScrollCue";
import { BEATS, spacerHeight } from "@/lib/mobile-beats";
import {
  collectSpacers,
  mapMobileScroll,
  type MobileScrollState,
  type SpacerMetrics,
} from "@/lib/mobile-progress";
import { useApp } from "@/context/AppContext";
import { useLatchedProgress } from "@/hooks/useLatchedProgress";
import { AuroraBackground } from "@/components/AuroraBackground";
import { KEY_RIGID_PROGRESS } from "@/components/BlobMorph";

const LAST_INDEX = BEATS.length - 1;

export function MobileExperience() {
  const { setActiveSection, setActiveBeat } = useApp();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const spacersRef = useRef<SpacerMetrics[]>([]);
  const prevStateRef = useRef<MobileScrollState | null>(null);

  const [beatIndex, setBeatIndex] = useState(0);
  const [blobProgress, setBlobProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    spacersRef.current = collectSpacers(el);
  }, []);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const state = mapMobileScroll(el.scrollTop, spacersRef.current);
    const prev = prevStateRef.current;

    /* `mandatory` snap settles each gesture on exactly one beat port, so the
       panel swaps the moment the mapping changes. */
    if (!prev || prev.beatIndex !== state.beatIndex) {
      setBeatIndex(state.beatIndex);
      setActiveBeat(state.beatIndex);
    }
    if (!prev || prev.phase !== state.phase) {
      setActiveSection(state.phase);
    }
    if (!prev || prev.blobProgress !== state.blobProgress) {
      setBlobProgress(state.blobProgress);
    }
    if (el.scrollTop > 2) setHasScrolled(true);

    prevStateRef.current = state;
  }, [setActiveSection, setActiveBeat]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      sync();
    });
  }, [sync]);

  /* Measure spacers initially and whenever the viewport changes. */
  useEffect(() => {
    measure();
    sync();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure, sync]);

  const activeBeat = BEATS[beatIndex];

  /* Key-resolution lock-in: after the key fully resolves once, it replaces the
     blob on every beat (effective progress stays at 1). */
  const effectiveProgress = useLatchedProgress(blobProgress);

  const isKeyBeat = activeBeat.id === "key";
  const isKeyResolved = effectiveProgress >= KEY_RIGID_PROGRESS;

  return (
    <main className="relative h-svh w-full overflow-hidden bg-black text-white">
      {/* Aurora brand background — identical on every beat. */}
      <AuroraBackground />

      {/* Top 40% blob stage (positioned via .mobile-stage). */}
      <BlobStage className="mobile-stage">
        <BlobMorph progress={effectiveProgress} />
        <KeyHitArea progress={effectiveProgress} />
      </BlobStage>

      {/* Bottom 60% beat content (fixed; pointer-events pass through) */}
      <MobileBeatPanel beat={activeBeat} isKeyResolved={isKeyResolved} isKeyBeat={isKeyBeat} />

      {beatIndex === 0 && <MobileScrollCue visible={!hasScrolled} />}

      {/* Full-screen scroller of invisible spacers — drives the whole layout.
          Keep this div last/highest so touches anywhere reach it. */}
      <div
        ref={scrollerRef}
        id="scroll-container"
        className="mobile-scroller"
        onScroll={handleScroll}
      >
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            data-mobile-spacer
            data-mobile-phase={beat.phase}
            className="mobile-spacer"
            style={{ minHeight: spacerHeight(beat, i === LAST_INDEX) }}
          />
        ))}
      </div>
    </main>
  );
}