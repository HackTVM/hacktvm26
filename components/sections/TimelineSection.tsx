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
        <div className="absolute left-5 top-20 sm:left-8 md:left-[6%] md:top-[14%] max-w-md text-left md:text-left flex flex-col justify-between">
          <div>
            <div className="pb-6">
              <h1 className="text-2xl font-bold font-mono text-glow">
                What You Can Win
              </h1>
            </div>
            <FlickerGroup className="space-y-6" groupId="timeline-left-top">
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold">Top 5 Finalists</h2>
                <p>&#8377;10,000 development grant per team to build out your prototype</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold">Top 3 Winners</h2>
                <p>Cash prizes of &#8377;25000, &#8377;15000 and &#8377;10000 and project-based internships with partner tech companies</p>
              </div>
              <div>
                <h2 className="pb-1 font-mono uppercase tracking-wide font-bold">All Participants</h2>
                <p>Official certificates, direct tech industry exposure and mentor feedback</p>
              </div>
            </FlickerGroup>
          </div>
          <div className="mt-24">
            <div className="pb-4">
              <h1 className="text-2xl font-bold font-mono text-glow">
                How We Judge
              </h1>
            </div>
            <ul className="list-disc pl-6 leading-7">
              <FlickerGroup groupId="timeline-left-bottom">
                <li><b>Concept & Vision:</b> Idea originality and a realistic roadmap to scale it</li>
                <li><b>Theme Alignment:</b> Real-world impact solved from the user's perspective, not assumptions</li>
                <li><b>Technical Execution:</b> Working code or hardware that you can defend in technical Q&A</li>
              </FlickerGroup>
            </ul>
          </div>
        </div>

        {/* Right rail — Registration Details (centred) */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 sm:right-8 md:right-[6%] max-w-md">
          <div className="pb-6">
            <h1 className="text-2xl font-bold font-mono text-glow">
              Registration Checklist
            </h1>
          </div>
          <div className="leading-7">
            <p className="pb-2">Before you hit submit, make sure your team has all of this sorted out:</p>
            <ul className="list-disc pl-6">
              <FlickerGroup className="leading-7 space-y-2" groupId="timeline-right">
                <li><b>Grade Level:</b> Students in Grades 8 to 12</li>
                <li><b>Team Size:</b> 2 to 4 students per team</li>
                <li><b>Team Limit:</b> Strictly 1 team per school</li>
                <li><b>Faculty Mentor:</b> 1 teacher or faculty member to accompany the team as a mentor</li>
                <li><b>Principal's Approval:</b> A signed and stamped Letter of Authorization from your school Principal</li>
              </FlickerGroup>
            </ul>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
