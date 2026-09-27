"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { EVENT } from "@/lib/event";
import { KEY_HIT_AREA_ID } from "@/components/KeyHitArea";
import { Magnetic } from "@/components/Magnetic";
import { Mail } from "lucide-react";

/**
 * HackTVM'26 — Access Point
 * KeyModal — registration/contact modal opened from the resolved key.
 *
 * Behaviour:
 *  - First open: grows from the key's captured on-screen rect (desktop) or
 *    slides up as a full-screen bottom sheet (mobile). Every later open in
 *    the session (+ reduced motion) is instant.
 *  - Close via close button, Esc, or backdrop tap on desktop.
 *  - A11y: dialog + aria-labelledby, focus trap, focus moves in on open and
 *    returns to the key on close, scroller scroll-locked while open.
 *  - z-index sits above Header/Footer (z-50) and the blob (z-10) but below
 *    the film-grain layer (z-9999).
 */

const SCROLLER_ID = "scroll-container";
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (n) => n.offsetParent !== null || n === document.activeElement,
  );
}

/** True below the first breakpoint (matches Tailwind's `sm:`). */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

/** Target: October 10, 2026, 8:00 AM IST (UTC+5:30) */
const TARGET_DATE = new Date("2026-10-10T02:30:00.000Z"); // 8:00 AM IST = 02:30 UTC

function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = TARGET_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14 text-center">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <span
            className="font-mono text-6xl sm:text-7xl font-bold text-cream tabular-nums"
            aria-label={`${value} ${label.toLowerCase()}`}
          >
            {String(value).padStart(2, "0")}
          </span>
          <span className="font-mono text-sm uppercase tracking-[0.2em] text-gray-mid">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function KeyModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    hasOpenedModal,
    setHasOpenedModal,
    setHasUnlocked,
    isReducedMotion,
    modalOrigin,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);
  const isSheet = useIsMobile();

  const handleClose = useCallback(() => {
    if (!hasOpenedModal) {
      setHasOpenedModal(true);
      setHasUnlocked(true);
    }
    setIsModalOpen(false);
  }, [hasOpenedModal, setHasOpenedModal, setHasUnlocked, setIsModalOpen]);

  /* Scroll lock — the page scroller is a custom container, not window. */
  useEffect(() => {
    if (!isModalOpen) return;
    const scroller = document.getElementById(SCROLLER_ID);
    if (!scroller) return;
    const prev = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    return () => {
      scroller.style.overflow = prev;
    };
  }, [isModalOpen]);

  /* Escape to close. */
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, handleClose]);

  /* Focus in on open. */
  useEffect(() => {
    if (!isModalOpen) return;
    const el = panelRef.current;
    if (!el) return;
    const targets = getFocusable(el);
    requestAnimationFrame(() => {
      (targets[0] ?? el).focus();
    });
  }, [isModalOpen]);

  /* Focus trap. */
  useEffect(() => {
    if (!isModalOpen) return;
    const el = panelRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const targets = getFocusable(el);
      if (targets.length === 0) {
        e.preventDefault();
        return;
      }
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  /* Focus back on the key once the exit animation completes. */
  const handleExitComplete = useCallback(() => {
    const key = document.getElementById(KEY_HIT_AREA_ID);
    key?.focus();
  }, []);

  const handleBackdropClick = useCallback(() => {
    if (window.matchMedia("(min-width: 640px)").matches) handleClose();
  }, [handleClose]);

  const firstOpen = !hasOpenedModal && !isReducedMotion;
  const growFromKey = firstOpen && !isSheet && modalOrigin !== null;
  const slideUp = firstOpen && isSheet;

  const initial = growFromKey
    ? { scale: 0.08, opacity: 0.15 }
    : slideUp
      ? { y: "100%" }
      : false;
  const animate = { scale: 1, y: "0%", opacity: 1 };
  const exit = { opacity: 0 };
  const transition = isReducedMotion || !firstOpen
    ? { duration: 0 }
    : slideUp
      ? ({ type: "spring" } as const)
      : { duration: 0.45, ease: "easeOut" as const };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isModalOpen && (
        <>
          <motion.div
            key="key-modal-backdrop"
            className="fixed inset-0 z-[8999] modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReducedMotion ? 0 : 0.25 }}
            onClick={handleBackdropClick}
          />

          <motion.div
            key="key-modal-panel"
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            style={
              growFromKey && modalOrigin
                ? { transformOrigin: `${modalOrigin.x}px ${modalOrigin.y}px` }
                : undefined
            }
            className="fixed inset-0 z-[9000] flex items-end justify-center sm:items-center sm:p-6 pointer-events-none"
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="key-modal-title"
              className={[
                "pointer-events-auto relative flex flex-col overflow-hidden",
                "h-svh w-full sm:h-[min(86dvh,760px)] sm:w-[min(92vw,1100px)]",
                "border border-black bg-black",
              ].join(" ")}
            >
              <Magnetic
                className="absolute right-4 top-4 z-10"
                pull={4}
                glow={14}
                radius={80}
                borderRadius="9999px"
              >
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className="glow-press flex h-11 w-11 items-center justify-center text-cream transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              </Magnetic>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex min-h-full flex-col justify-center px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-12 sm:px-10 sm:pb-8">
                  {/* Row 1 — Countdown */}
                  <section aria-labelledby="countdown-heading" className="w-full pb-16">
                    <h3 id="countdown-heading" className="sr-only">
                      Countdown to HackTVM'26
                    </h3>
                    <Countdown />
                  </section>

                  {/* Row 2 — Download buttons */}
                  <section aria-labelledby="downloads-heading" className="mt-10 w-full">
                    <h3 id="downloads-heading" className="sr-only">
                      Downloads
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                      <Magnetic
                        className="block w-full sm:w-fit"
                        pull={6}
                        glow={18}
                        radius={90}
                        borderRadius="0"
                      >
                        <a
                          href={EVENT.brochure.path}
                          download
                          className="glow-press block w-full bg-cream py-3 text-center font-mono text-sm font-bold text-black active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:px-10"
                        >
                          Download Brochure
                        </a>
                      </Magnetic>
                      <button
                        type="button"
                        disabled
                        className="glow-press block w-full bg-white/10 py-3 text-center font-mono text-sm font-bold text-gray-mid cursor-not-allowed sm:w-fit sm:px-10"
                        aria-label="Download Hackbook (coming Oct 3)"
                      >
                        Download Hackbook
                      </button>
                    </div>
                  </section>

                  {/* Row 3 — Socials */}
                  <section aria-labelledby="socials-heading" className="mt-10 w-full">
                    <h3 id="socials-heading" className="sr-only">
                      Social links
                    </h3>
                    <div className="flex items-center justify-center gap-6">
                      <a
                        href="mailto:hackclubtvm@gmail.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Email us"
                        className="glow-press flex h-12 w-12 items-center justify-center border border-white/15 bg-white/5 text-gray-light transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
                      >
                        <Mail width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
                      </a>
                      <a
                        href="https://www.instagram.com/hacktvm/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="glow-press flex h-12 w-12 items-center justify-center border border-white/15 bg-white/5 text-gray-light transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </a>
                      <a
                        href="https://github.com/hackTVM"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                        className="glow-press flex h-12 w-12 items-center justify-center border border-white/15 bg-white/5 text-gray-light transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                      </a>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
