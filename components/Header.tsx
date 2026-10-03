/**
 * HackTVM'26 — Access Point
 * Persistent header with centered word logo.
 *
 * Fixed to top of viewport, z-index above scroll content.
 * Hidden during the loading screen (isLoading === true).
 * Uses Framer Motion for fade-in/out on loading transition.
 */
"use client";

import { m } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { DURATIONS } from "@/lib/constants";
import { HamburgerMenu } from "@/components/HamburgerMenu";

export function Header() {
  const { isLoading, isReducedMotion } = useApp();

  return (
    <m.header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none pt-4 px-4"
      aria-hidden={isLoading}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 0 : 1 }}
      transition={{
        duration: isReducedMotion ? 0 : DURATIONS.normal,
        delay: isReducedMotion ? 0 : 0.3,
      }}
    >
      {/* Left spacer for balance - matches hamburger menu width */}
      <div className="w-[48px] h-[48px]" aria-hidden="true" />

      {/* Centered wordmark */}
      <div className="flex-1 flex justify-center pointer-events-auto">
        <img
          src="/logo.png"
          alt="HackTVM'26"
          width={240}
          height={40}
          fetchPriority="high"
          decoding="async"
          className="select-none py-4 h-auto w-auto max-h-12"
        />
      </div>

      {/* Hamburger menu - top right */}
      <HamburgerMenu />
    </m.header>
  );
}
