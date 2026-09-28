"use client";

import { SectionWrapper } from "@/components/SectionWrapper";
import { FlickerGroup } from "@/components/FlickerGroup";

export function OverviewSection() {
  return (
    <SectionWrapper id="overview" headingLevel={1} title="Overview">
      <div className="h-full w-full">
        {/* Top-left slot */}
        <div className="absolute left-5 top-20 sm:left-8 md:left-[6%] md:top-[14%] max-w-md text-left md:text-left">
          <div className="mb-4">
            <h1 className="text-3xl font-bold font-mono text-glow">
              HackTVM'26: Access Point
            </h1>
            <p className="py-1 font-mono uppercase tracking-wide text-base">Everyone deserves a way in</p>
          </div>
          <FlickerGroup groupId="overview-top">
            <p className="text-gray-mid leading-8 text-lg">
              Organized by The School of the Good Shepherd's HackTVM, HackTVM'26 is the Second Edition of Trivandrum's first and only inter-school hackathon. It gives student innovators a direct inroad to the tech industry by challenging them to build working technology that solves real-world challenges.
            </p>
          </FlickerGroup>
        </div>

        {/* Bottom-right slot */}
        <div className="absolute right-20 bottom-0 sm:right-8 md:right-[6%] md:bottom-[16%] max-w-md ">
          <h2 className="py-1 font-mono uppercase tracking-wide text-xl font-bold mb-2 text-glow">
            Overview
          </h2>
          <ul className="text-gray-mid leading-8 text-lg">
            <FlickerGroup className="space-y-1" groupId="overview-bottom">
              <li><b>Date:</b> October 10, 2026</li>
              <li><b>Venue:</b> The School of the Good Shepherd</li>
              <li><b>Eligibility:</b> Grades 8 to 12</li>
              <li><b>Entry Fee:</b> &#8377;1200 per team(after screening)</li>
              <li><b>The Opportunity:</b> &#8377;10,000 development grant for finalist teams and tech-internships, along with cash prizes, for top 3 winners</li>
            </FlickerGroup>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
