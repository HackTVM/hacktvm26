/**
 * HackTVM'26 — Access Point
 * ThemeSection — content on the full left rail and a bottom-right slot.
 */
"use client";

import { SectionWrapper } from "@/components/SectionWrapper";
import { FlickerGroup } from "@/components/FlickerGroup";

export function ThemeSection() {
  return (
    <SectionWrapper id="theme" title="Theme">
      <div className="h-full w-full">
        {/* Full left rail — vertically centred */}
        <div className="absolute space-y-4 left-5 top-1/2 -translate-y-1/2 sm:left-8 md:left-[6%] max-w-md text-left">
          <div className="pb-2">
            <h1 className="text-2xl font-bold font-mono text-glow">
              Access Point
            </h1>
          </div>
          <FlickerGroup groupId="theme-left">
            <p className="leading-7">If a system or space stands between a person and their independence, it's broken. You're here to build the sledgehammer</p>
            <p className="leading-7">
              <b>Access Point</b> challenges students to design working technology that closes real, everyday gaps in accessibility and inclusivity. Modern design optimizes for an "idealized default user," treating edge cases as an afterthought. We are here to shift that dynamic.</p>
            <p className="leading-7">
              Building for accessibility and inclusivity forces you to confront some of the most demanding problems in product design and engineering. Every system must be leaner, faster, and remarkably resilient, with zero room for error.
            </p>
          </FlickerGroup>
        </div>

        {/* Bottom-right slot */}
        <div className="absolute right-5 bottom-20 sm:right-8 md:right-[6%] md:bottom-[16%] max-w-md text-right">
          <h2 className="py-1 font-mono uppercase tracking-wide text-lg font-bold mb-2 text-glow">
            The Hackbook
          </h2>
          <FlickerGroup groupId="theme-right">
            <p className="text-gray-mid">
              Further specifics on the theme, along with research context and reference material will be released on <b>October 3rd</b> in the form of <b>The Hackbook</b>. It will provide additional context with recommended tools/APIs, judging criteria, etc.
            </p>
          </FlickerGroup>
        </div>
      </div>
    </SectionWrapper>
  );
}
