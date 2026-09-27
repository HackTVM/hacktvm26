/**
 * HackTVM'26 — Access Point
 * KeySection — shows the navigation links after the key fully resolves.
 * Links only appear on this section (Phase 4) and fade in after KEY_RIGID_PROGRESS.
 */
"use client";

import { useEffect, useState } from "react";
import { SectionWrapper } from "@/components/SectionWrapper";
import { KEY_RIGID_PROGRESS } from "@/components/BlobMorph";

interface KeySectionProps {
  progress: number;
}

export function KeySection({ progress }: KeySectionProps) {
  const isResolved = progress >= KEY_RIGID_PROGRESS;
  const [showLinks, setShowLinks] = useState(false);

  useEffect(() => {
    if (!isResolved) {
      setShowLinks(false);
      return;
    }
    // Delay links after key is fully visible (key fade-in completes at KEY_RIGID_PROGRESS)
    const timer = window.setTimeout(() => {
      setShowLinks(true);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [isResolved]);

  const links = [
    { label: "Answers", href: "#" },
    { label: "Builds", href: "#" },
    { label: "Moments", href: "#" },
  ] as const;

  return (
    <SectionWrapper id="key" title="The Key">
      <div className="h-full w-full flex flex-col items-center justify-end pb-36">
        {showLinks && (
          <nav
            className="w-full max-w-[80%] lg:max-w-[50%] opacity-0 animate-fade-in transition-opacity duration-700"
            aria-label="Navigation"
          >
            <ul className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-mono text-sm sm:text-base uppercase tracking-[0.2em] text-cream text-glow hover:text-cream/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream block sm:inline-block text-center sm:text-left"
                    aria-label={link.label}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </SectionWrapper>
  );
}
