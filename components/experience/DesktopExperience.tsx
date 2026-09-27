/**
 * HackTVM'26 — Access Point
 * Desktop experience (>= 768px). Renders the classic scroll-snap sections
 * with the center blob. This is the original page layout — visually and
 * behaviorally unchanged from before the mobile pass.
 */
"use client";
import { useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { BlobMorph, type KeyVisualRect } from "@/components/BlobMorph";
import { BlobStage } from "@/components/BlobStage";
import { KeyHitArea } from "@/components/KeyHitArea";
import { KeycapGlow } from "@/components/KeycapGlow";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useLatchedProgress } from "@/hooks/useLatchedProgress";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { ThemeSection } from "@/components/sections/ThemeSection";
import { FormatSection } from "@/components/sections/FormatSection";
import { TimelineSection } from "@/components/sections/TimelineSection";
import { KeySection } from "@/components/sections/KeySection";
import { AuroraBackground } from "@/components/AuroraBackground";

export function DesktopExperience() {
  useActiveSection();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  /* The resolved keycap's box, published once by BlobMorph's silhouette
     pipeline. KeycapGlow positions its spill from it, so the two can't drift
     apart the way a hand-copied set of percentages would. */
  const [keyRect, setKeyRect] = useState<KeyVisualRect | null>(null);

  // Key-resolution lock-in: after the key fully resolves once, it replaces the
  // blob on every section (effective progress stays at 1).
  const effectiveProgress = useLatchedProgress(progress);

  // Measure scroll progress inside the snap container (0.0 to 1.0)
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  // Feed scroll updates directly into progress state
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
  });

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Aurora brand background — identical on every section. */}
      <AuroraBackground />

      {/* Fixed Blob overlay receiving real-time scroll progress. The spill
          renders BEFORE the svg so it composites behind the key; same grid
          cell, so it lands exactly on it. */}
      <BlobStage>
        <KeycapGlow progress={effectiveProgress} rect={keyRect} />
        <BlobMorph progress={effectiveProgress} onKeyRect={setKeyRect} />
        <KeyHitArea progress={effectiveProgress} />
      </BlobStage>

      {/* Scroll-snap container with containerRef attached */}
      <div
        ref={containerRef}
        id="scroll-container"
        className="snap-container relative h-screen overflow-y-auto snap-y snap-mandatory"
      >
        <OverviewSection />
        <ThemeSection />
        <FormatSection />
        <TimelineSection />
        <KeySection />
      </div>
    </main>
  );
}