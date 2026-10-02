/**
 * Hook: useMediaQuery / useIsMobile
 *
 * SSR-safe media-query hook. Returns `false` during server rendering and the
 * first client render, then flips to the real value inside an effect. The
 * swap in layout is masked by the full-screen LoadingScreen, so neither the
 * page nor the user sees the "desktop first" frame.
 *
 * Mobile is defined as strictly below the `md` breakpoint (MD = 768px in
 * lib/constants): desktop takes over at >= 768px, exactly matching the desktop
 * branch of the --blob-size / rail-inset media queries in globals.css. Note
 * KeyModal uses its own SM = 640px sheet breakpoint — that one is deliberate.
 */
"use client";

import { useEffect, useState } from "react";
import { MD } from "@/lib/constants";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handleChange = () => setMatches(mq.matches);
    handleChange();
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

/** True on any viewport narrower than the app's `md` breakpoint (MD = 768px). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MD - 1}px)`);
}