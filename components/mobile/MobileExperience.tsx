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

/* How long the scroller must be quiet before the active beat is committed.
   The blob tracks scrollTop live, so this only gates when the beat PANEL and
   the dot highlight swap over. Sized to sit above the tail of momentum scroll
   events (~a frame or two after the fling ends) while staying imperceptible
   on a deliberate single-beat scroll. */
const BEAT_COMMIT_DELAY_MS = 120;

export function MobileExperience() {
  const { setActiveSection, setActiveBeat } = useApp();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const spacersRef = useRef<SpacerMetrics[]>([]);
  const prevStateRef = useRef<MobileScrollState | null>(null);
  /* Beat the scroller is currently *over*, waiting for the scroll to settle. */
  const pendingRef = useRef<{ beatIndex: number; phase: number } | null>(null);
  const commitTimerRef = useRef(0);

  const [beatIndex, setBeatIndex] = useState(0);
  const [blobProgress, setBlobProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    spacersRef.current = collectSpacers(el);
  }, []);

  /* Settle the staged beat. Driven by the debounce timer, and called directly
     on resize so a viewport change settles the panel immediately instead of
     waiting out the timer. */
  const commitBeat = useCallback(() => {
    window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = 0;
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setBeatIndex(pending.beatIndex);
    setActiveBeat(pending.beatIndex);
    setActiveSection(pending.phase);
  }, [setActiveSection, setActiveBeat]);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const state = mapMobileScroll(el.scrollTop, spacersRef.current);
    const prev = prevStateRef.current;

    /* Live: the blob morphs with the scroll, unhurried by the commit delay. */
    if (!prev || prev.blobProgress !== state.blobProgress) {
      setBlobProgress(state.blobProgress);
    }
    if (el.scrollTop > 2) setHasScrolled(true);

    /* Deferred: one flick can cross several beats under `proximity` snap, so
       stage the landing beat and commit it once the scroller goes quiet. The
       panel then runs a single crossfade instead of flashing every beat it
       passed over. */
    const pending = pendingRef.current;
    if (!pending || pending.beatIndex !== state.beatIndex || pending.phase !== state.phase) {
      pendingRef.current = { beatIndex: state.beatIndex, phase: state.phase };
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(commitBeat, BEAT_COMMIT_DELAY_MS);
    }

    prevStateRef.current = state;
  }, [commitBeat]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      sync();
    });
  }, [sync]);

  /* Resize invalidates spacer geometry, so re-measure and re-derive before
     settling — a beat staged against the old metrics is worth nothing. */
  const handleMeasure = useCallback(() => {
    measure();
    sync();
    commitBeat();
  }, [measure, sync, commitBeat]);

  /* Measure spacers initially and whenever the viewport changes. */
  useEffect(() => {
    measure();
    sync();
    window.addEventListener("resize", handleMeasure);
    return () => {
      window.removeEventListener("resize", handleMeasure);
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(commitTimerRef.current);
    };
  }, [measure, sync, handleMeasure]);

  /* Dev-only A/B: `?snap` in the URL pins the mobile per-beat snap back to
     `mandatory` (CSS on body.snap). The default is `proximity` — a flick
     travels as far as its momentum carries — so this restores hard one-beat
     stops for on-device comparison. */
  useEffect(() => {
    const snap = new URLSearchParams(window.location.search).has("snap");
    if (snap) document.body.classList.add("snap");
    return () => document.body.classList.remove("snap");
  }, []);

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