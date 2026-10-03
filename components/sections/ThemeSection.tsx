/**
 * HackTVM'26 — Access Point
 * ThemeSection — content on the full left rail and a bottom-right slot.
 */
"use client";

import { memo } from "react";

import { SectionWrapper } from "@/components/SectionWrapper";
import { FlickerGroup } from "@/components/FlickerGroup";

function ThemeSectionImpl() {
  return (
    <SectionWrapper id="theme" title="Theme">
      <div className="h-full w-full">
        {/* Full left rail — vertically centred */}
        <div className="absolute space-y-4 left-5 top-1/2 -translate-y-1/2 sm:left-8 md:left-[var(--rail-inset-x)] max-w-[var(--rail-max-w)] text-left">
          <div className="pb-2">
            <h1 className="text-3xl font-bold font-mono text-glow">
              Access Point
            </h1>
          </div>
          <FlickerGroup className="space-y-6" groupId="theme-left">
            <p className="leading-8 text-lg">If a system or space stands between a person and their independence, it's broken. You're here to build the sledgehammer</p>
            <p className="leading-8 text-lg">
              <b>Access Point</b> challenges students to design working technology that closes real, everyday gaps in accessibility and inclusivity. Modern design optimizes for an "idealized default user", treating edge cases as an afterthought. We are here to shift that dynamic.</p>
            <p className="leading-8 text-lg">
              Building for accessibility and inclusivity forces you to confront some of the most demanding problems in product design and engineering. Every system must be leaner, faster, and remarkably resilient, with zero room for error.
            </p>
          </FlickerGroup>
        </div>

        {/* Bottom-right slot */}
        <div className="absolute right-5 bottom-20 sm:right-8 md:right-[var(--rail-inset-x)] md:bottom-[var(--rail-inset-bottom)] max-w-[var(--rail-max-w)] text-right">
          <h2 className="py-1 font-mono uppercase tracking-wide text-xl font-bold mb-2 text-glow">
            The Hackbook
          </h2>
          <FlickerGroup groupId="theme-right">
            <p className="text-gray-mid text-lg leading-8">
              Further specifics on the theme, along with research context and reference material will be released on <b>October 3rd</b> in the form of <b>The Hackbook</b>. It will provide additional context with guidlines, recommended tools and APIs, judging criteria, etc.
            </p>
          </FlickerGroup>
        </div>
      </div>
    </SectionWrapper>
  );
}

/* memo()'d so that state changes above these sections (AppContext, the sticky
   key-resolved flag) don't re-reconcile their markup. The sections take no
   props or only a boolean, so a shallow compare is enough — no custom
   comparator, and no risk of stale closures since none of them close over
   changing values. */
export const ThemeSection = memo(ThemeSectionImpl);
