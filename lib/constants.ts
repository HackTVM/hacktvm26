/**
 * HackTVM'26 — Access Point
 * Central constants: section configuration and animation durations.
 */

/* ---------- Breakpoints (px) ----------
 * Mirror Tailwind's default width scale. These must track the `sm:`/`md:`
 * variants used in markup — CSS can't read this file, so keep the two in sync.
 *
 * MD (768px) is the app's real mobile/desktop switch: it gates the whole
 * experience tree (app/page.tsx) and the two globals.css layout queries.
 *
 * SM (640px) exists only for KeyModal, a self-contained overlay whose panel
 * switches from an edge-to-edge sheet to an inset dialog on `sm:`. It is
 * intentionally NOT MD — see the handleBackdropClick comment in
 * components/KeyModal.tsx for what still depends on this edge.
 */
export const SM = 640;
export const MD = 768;

/* ---------- Section IDs (in scroll order) ---------- */
export const SECTION_IDS = [
  "overview",
  "theme",
  "format",
  "timeline",
  "key",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** Human-readable labels for each section (used in aria-labels and dot nav). */
export const SECTION_LABELS: Record<SectionId, string> = {
  overview: "Overview",
  theme: "Theme",
  format: "Event Format",
  timeline: "Timeline & Registration",
  key: "The Key",
};

/* ---------- Animation Durations (seconds) ---------- */
export const DURATIONS = {
  /** Standard section fade in/out */
  normal: 0.5,
  /** Faster section fade (after unlock) */
  fast: 0.25,
  /** Instant — for reduced motion */
  none: 0,
} as const;
