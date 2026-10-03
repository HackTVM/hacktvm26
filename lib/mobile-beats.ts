/**
 * HackTVM'26 — Access Point
 * Mobile beat content.
 *
 * The mobile experience is a single full-screen scroller of invisible
 * "spacers" — one per beat. Each beat's `weight` scales the spacer's
 * min-height (weight × 80dvh), so denser beats get more scroll room. The
 * scroller never shows content; the active beat is rendered into the fixed
 * bottom panel by MobileBeatPanel.
 *
 * Copy is mirrored from the desktop sections. All numbers and dates come from
 * lib/event.ts where they exist there; anything event.ts doesn't carry is
 * hard-coded here (and only here on mobile).
 */

/* ---------- Beat content ---------- */
export type BeatContent =
  | { kind: "hero"; title: string; tagline: string; body: string }
  | { kind: "facts"; facts: { label: string; value: string }[] }
  | { kind: "statement"; title: string; body: string }
  | { kind: "list"; title: string; intro?: string; items: string[] }
  | {
    kind: "points";
    title: string;
    intro?: string;
    entries: { heading: string; body: string }[];
  }
  | { kind: "note"; title: string; body: string }
  | { kind: "key" };

export interface Beat {
  id: string;
  phase: number;
  weight: number;
  content: BeatContent;
}

/**
 * Spacer min-height for a beat. The last beat is forced to at least 100dvh so
 * its top edge is exactly reachable at maximum scroll (mirrors a desktop snap
 * section's "lands at the bottom" behaviour); 0.8×80dvh alone would leave its
 * start unobtainable.
 */
export function spacerHeight(beat: Beat, isLast: boolean): string {
  const base = `calc(${beat.weight} * 80dvh)`;
  return isLast ? `max(${base}, 100dvh)` : base;
}

export const BEATS: readonly Beat[] = [
  /* ---- Phase 0 · Overview ---- */
  {
    id: "intro",
    phase: 0,
    weight: 1,
    content: {
      kind: "hero",
      title: "HackTVM'26: Access Point",
      tagline: "Everyone deserves a way in",
      body: "Organized by The School of the Good Shepherd's Hack Club TVM, HackTVM'26 is the Second Edition of Trivandrum's first inter-school hackathon. It gives student innovators a direct inroad to the tech industry by challenging them to build working technology that solves real-world challenges.",
    },
  },

  /* ---- Phase 1 · Theme ---- */
  {
    id: "theme",
    phase: 1,
    weight: 0.8,
    content: {
      kind: "points",
      title: "Access Point",
      entries: [
        {
          heading: "The Theme",
          body: "Access Point challenges students to design working technology that closes real, everyday gaps in accessibility and inclusivity. Modern design optimizes for an 'idealized default user' treating edge cases as an afterthought. We are here to shift that dynamic.",
        },
        {
          heading: "The Challenge",
          body: "Building for accessibility and inclusivity forces you to confront some of the most demanding problems in product design and engineering. Every system must be leaner, faster, and remarkably resilient, with zero room for error.",
        },
      ],
    },
  },
  {
    id: "hackbook",
    phase: 1,
    weight: 0.8,
    content: {
      kind: "note",
      title: "The Hackbook",
      body: `Further specifics on the theme, research context, and reference material will be released on Oct 3 2026 in the form of The Hackbook — it will provide additional context with recommended tools and APIs, judging criteria, and more.`,
    },
  },
  /* ---- Phase 2 · Event Format ---- */
  {
    id: "format",
    phase: 2,
    weight: 1.3,
    content: {
      kind: "points",
      title: "Event Format",
      entries: [
        {
          heading: `The Hackathon - 10 Oct 2026`,
          body: "A 7-hour sprint where teams design, and build a solution to any one of the problem statements.",
        },
        {
          heading: "Development Phase",
          body: "Top 5 teams from Phase I receive a ₹10,000 development grant and 3 weeks to refine their prototypes and work on their final pitch.",
        },
        {
          heading: "Demo Day - 31 Oct 2026",
          body: "The top 5 teams present their finished products to a panel of industry judges. The top 3 teams are offered internship opportunities with partnership companies along with cash prizes worth ₹30,000.",
        },
      ],
    },
  },
  {
    id: "Itinerary",
    phase: 2,
    weight: 1,
    content: {
      kind: "facts",
      facts: [
        {
          label: "7:00 to 8:00",
          value: "Registrations",
        },
        {
          label: "8:00",
          value: "Hackathon Starts",
        },
        {
          label: "8:30 to 10:30",
          value: "Component Window",
        },
        {
          label: "15:00",
          value: "Hackathon Ends",
        },
        {
          label: "15:15 to 16:15",
          value: "Lunch Break",
        },
        {
          label: "15:15 to 18:45",
          value: "Judging",
        },
        {
          label: "19:00 to 19:45",
          value: "Valedictory",
        },
      ],
    },
  },
  {
    id: "prizes",
    phase: 3,
    weight: 1.3,
    content: {
      kind: "points",
      title: "What You Can Win",
      entries: [
        {
          heading: "Top 5 Finalists",
          body: "₹10,000 development grant per team to build out your prototype.",
        },
        {
          heading: "Top 3 Winners",
          body: "Cash prizes of ₹15,000, ₹10,000 and ₹5,000 — and project-based internships with our partnered tech companies: Hex20 Space, NeST Digital Pvt. Ltd. & Quinoid Business Solutions Pvt. Ltd.",
        },
        {
          heading: "All Participants",
          body: "Official certificates, direct tech-industry exposure, and mentor feedback.",
        },
      ],
    },
  },
  {
    id: "judging",
    phase: 3,
    weight: 1,
    content: {
      kind: "points",
      title: "How We Judge",
      entries: [
        {
          heading: "Concept & Vision",
          body: "Idea originality and a realistic roadmap to scale it.",
        },
        {
          heading: "Theme Alignment",
          body: "Real-world impact solved from the user's perspective, not assumptions.",
        },
        {
          heading: "Technical Execution",
          body: "Working code or hardware that you can defend in technical Q&A.",
        },
      ],
    },
  },

  /* ---- Phase 4 · The Key ---- */
  {
    id: "key",
    phase: 4,
    weight: 0.8,
    content: {
      kind: "key",
    },
  },
];
