/**
 * HackTVM'26 — Access Point
 * FormatSection — full text on both left and right of the blob.
 */
"use client";

import { SectionWrapper } from "@/components/SectionWrapper";
import { FlickerGroup } from "@/components/FlickerGroup";

export function FormatSection() {
  return (
    <SectionWrapper id="format" title="Event Format">
      <div className="h-full w-full">
        {/* Left rail — full, vertically centred */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 sm:left-8 md:left-[6%] max-w-md text-left">
          <div>
            <h1 className="text-3xl font-bold font-mono text-glow">
              Event Format
            </h1>
          </div>
          <p className="text-gray-mid leading-8 text-lg mt-4 mb-6">
            Most hackathons end when the timer hits zero. We give you the funding and the runway to actually finish what you started.
          </p>
          <div>
            <FlickerGroup groupId="format-left" className="space-y-8">
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide text-lg font-bold">The Hackathon &mdash; 10 Oct 2026</h2>
                <p className="text-lg">A 7-hour sprint where teams conceptualize, design, and build a solution to any one of the problem statements presented to them.</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide text-lg font-bold">Development Phase &mdash; 11 to 30 Oct 2026</h2>
                <p className="text-lg">Top 5 teams from Phase I will receive a &#8377;10,000 development grant and 3 weeks to refine their prototypes and work on their final pitch.</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide text-lg font-bold">Demo Day &mdash; 31 Oct 2026</h2>
                <p className="text-lg">The top 5 teams present their finished products to a panel of industry judges. The top 3 teams will be offered internship opportunities with partnership companies along with cash prizes worth &#8377;30,000.</p>
              </div>
            </FlickerGroup>
          </div>
        </div>

        {/* Right rail — full, vertically centred */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 sm:right-8 md:right-[6%] w-full max-w-md font-mono uppercase tracking-wide space-y-4">
          <h2 className="text-2xl font-bold font-mono text-glow">
            Itinerary
          </h2>
          <FlickerGroup className="font-mono uppercase tracking-wide space-y-4">
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">07:00 to 08:00</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Registrations</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">08:00</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Hackathon Start</p>
            </div>
            {/* TODO(dates): screening dates may have shifted — confirm before publishing */}
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">08:00 to 08:30</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Ideation Time</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">08:30 to 10:30</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Component Desk Window</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">15:00</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Hackathon Ends</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">15:15 to 16:15</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Lunch Break</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">15:15 to 18:45</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Judging</p>
            </div>
            <div className="grid grid-cols-3 w-full items-center">
              <p className="text-left text-base">19:00 to 19:45</p>
              <p className="text-center text-base">—</p>
              <p className="text-right text-base">Valedictory</p>
            </div>
          </FlickerGroup>
          {/* TODO(dates): registration was extended — update this row when new dates are final */}
        </div>
      </div>
    </SectionWrapper>
  );
}
