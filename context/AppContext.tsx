/**
 * HackTVM'26 — Access Point
 * Global application state context.
 *
 * Provides:
 * - activeSection: which snap-section is currently visible (0-indexed)
 * - activeBeat: index of the active beat in the mobile scroller (-1 on
 *   desktop, where the mobility dots are unused). Fed from the same
 *   beat-snap position tracking that drives the mobile scroll itself, so the
 *   mobile footer dots and the visible beat never disagree.
 * - hasUnlocked: true after the user has opened and closed the key modal once
 * - isModalOpen / hasOpenedModal: modal state and first-open tracking
 * - isReducedMotion: system prefers-reduced-motion setting
 * - isTouchDevice: touch-capable device detection
 * - isLoading: loading screen visible (prevents interaction with main content)
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsTouch } from "@/hooks/useIsTouch";
import { LazyMotion, domMin } from "framer-motion";

/* ---------- Shape ---------- */
interface AppState {
  activeSection: number;
  setActiveSection: (n: number) => void;

  /** Active beat index in the mobile scroller; -1 when no mobile component
   *  has claimed it (i.e. desktop). See MobileExperience sync(). */
  activeBeat: number;
  setActiveBeat: (n: number) => void;

  hasUnlocked: boolean;
  setHasUnlocked: (v: boolean) => void;

  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;

  hasOpenedModal: boolean;
  setHasOpenedModal: (v: boolean) => void;

  modalOrigin: ModalOrigin | null;
  setModalOrigin: (o: ModalOrigin | null) => void;

  isReducedMotion: boolean;
  isTouchDevice: boolean;

  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

/* ---------- Modal origin (in viewport px) ---------- */
interface ModalOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ---------- Context ---------- */
const AppContext = createContext<AppState | null>(null);

/* ---------- Provider ---------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState(0);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<ModalOrigin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isReducedMotion = useReducedMotion();
  const isTouchDevice = useIsTouch();

  const value = useMemo<AppState>(
    () => ({
      activeSection,
      setActiveSection,
      activeBeat,
      setActiveBeat,
      hasUnlocked,
      setHasUnlocked,
      isModalOpen,
      setIsModalOpen,
      hasOpenedModal,
      setHasOpenedModal,
      modalOrigin,
      setModalOrigin,
      isReducedMotion,
      isTouchDevice,
      isLoading,
      setIsLoading,
    }),
    [
      activeSection,
      activeBeat,
      hasUnlocked,
      isModalOpen,
      hasOpenedModal,
      modalOrigin,
      isReducedMotion,
      isTouchDevice,
      isLoading,
    ],
  );

  /* domMin is `animations` only — the `animate`/`initial`/`transition` and
     `exit` features this app actually uses. It deliberately omits drag, pan
     and layout projection (the `domMax` extras) plus the hover/tap/focus/
     inView gesture features, none of which appear anywhere in the tree.
     `strict` makes any stray `motion.*` inside throw instead of silently
     re-pulling the full bundle. Must live in a client component: the
     features object can't cross the server->client serialization boundary,
     which is why this is here rather than in app/layout.tsx. */
  return (
    <AppContext.Provider value={value}>
      <LazyMotion features={domMin} strict>
        {children}
      </LazyMotion>
    </AppContext.Provider>
  );
}

/* ---------- Hook ---------- */
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an <AppProvider>");
  }
  return ctx;
}
