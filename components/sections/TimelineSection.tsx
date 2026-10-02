/**
 * HackTVM'26 — Access Point
 * TimelineSection — Timeline (left rail) + Registration Details (right rail).
 */
"use client";

import { SectionWrapper } from "@/components/SectionWrapper";
import { FlickerGroup } from "@/components/FlickerGroup";

export function TimelineSection() {
  return (
    <SectionWrapper id="timeline" title="Timeline & Registration">
      <div className="h-full w-full">
        <div className="absolute left-5 top-20 sm:left-8 md:left-[var(--rail-inset-x)] md:top-[var(--rail-inset-top)] max-w-[var(--rail-max-w)] text-left flex flex-col justify-between">
          <div>
            <div className="pb-6">
              <h1 className="text-3xl font-bold font-mono text-glow">
                What You Can Win
              </h1>
            </div>
            <FlickerGroup className="space-y-6" groupId="timeline-left-top">
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold text-lg">Top 5 Finalists</h2>
                <p className="text-lg">&#8377;10,000 development grant per team to build out your prototype</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold text-lg">Top 3 Winners</h2>
                <p className="text-lg">Cash prizes of &#8377;15,000, &#8377;10,000 and &#8377;5,000 and project-based internships with partner tech companies</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold text-lg">All Participants</h2>
                <p className="text-lg">Official certificates, direct tech industry exposure and mentor feedback</p>
              </div>
            </FlickerGroup>
          </div>
        </div>

        {/* This rail keeps its fixed bottom-30 rather than a percentage inset —
            unlike its siblings it was never on the rail-inset scale, so moving
            it to --rail-inset-bottom would shift it on wide screens. It still
            picks up the width guard. */}
        <div className="absolute right-5 bottom-30 sm:right-8 md:right-[var(--rail-inset-x)] max-w-[var(--rail-max-w)]">
          <div className="pb-4">
            <h1 className="text-3xl font-bold font-mono text-glow">
              How We Judge
            </h1>
          </div>
          <FlickerGroup groupId="timeline-left-bottom">
            <ul className="list-disc pl-6 leading-7 space-y-2">
              <li className="text-lg"><b>Concept & Vision:</b> Idea originality and a realistic roadmap to scale it</li>
              <li className="text-lg"><b>Theme Alignment:</b> Real-world impact solved from the user's perspective, not assumptions</li>
              <li className="text-lg"><b>Technical Execution:</b> Working code or hardware that you can defend in technical Q&A</li>
            </ul>
          </FlickerGroup>
        </div>
      </div>
    </SectionWrapper>
  );
}
