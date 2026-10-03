import { useRef } from "react";
import { useScroll } from "framer-motion";
import { BlobMorph } from "@/components/BlobMorph";
import { BlobStage } from "@/components/BlobStage";
import { KeyHitArea } from "@/components/KeyHitArea";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useLatchedKeyResolved } from "@/hooks/useLatchedProgress";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { ThemeSection } from "@/components/sections/ThemeSection";
import { FormatSection } from "@/components/sections/FormatSection";
import { TimelineSection } from "@/components/sections/TimelineSection";
import { KeySection } from "@/components/sections/KeySection";
import { AuroraBackground } from "@/components/AuroraBackground";

export function DesktopExperience() {
  useActiveSection();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll progress inside the snap container (0.0 to 1.0).
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  /* Progress deliberately never enters React state.
     This used to be `useMotionValueEvent(scrollYProgress, "change", setProgress)`
     feeding a `useState`, which re-rendered this component — and therefore
     AuroraBackground, the whole BlobMorph SVG, KeyHitArea and all five
     sections — on every scroll frame, ~60x/second, purely to derive two
     booleans. BlobMorph subscribes to the MotionValue directly inside its
     physics loop (outside React), and the two consumers below only need
     `progress >= KEY_RIGID_PROGRESS`, so a sticky boolean is enough. Result:
     zero React renders on scroll, and KeyHitArea/KeySection re-render once per
     session instead of continuously. */
  const isKeyResolved = useLatchedKeyResolved(scrollYProgress);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Aurora brand background — identical on every section. */}
      <AuroraBackground />

      {/* Fixed Blob overlay receiving real-time scroll progress. */}
      <BlobStage>
        <BlobMorph progressSource={scrollYProgress} />
        <KeyHitArea isKeyResolved={isKeyResolved} />
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
        <KeySection isKeyResolved={isKeyResolved} />
      </div>
    </main>
  );
}