"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { X, Menu } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Entry", href: "/" },
  { label: "Builds", href: "#", disabled: true, comingSoon: true },
  { label: "Moments", href: "#", disabled: true, comingSoon: true },
];

// Theme colors
const THEME_BLUE = "#4B7CD3";
const WHITE = "#FFFFFF";

export function HamburgerMenu() {
  const { isReducedMotion } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Toggle menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Opening: show links after box expands enough
      setTimeout(() => setShowLinks(true), 300);
    } else {
      // Closing: hide links immediately
      setShowLinks(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggleMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        toggleMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus trap when open
  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    menuRef.current?.addEventListener("keydown", handleTab);
    return () => menuRef.current?.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Focus first link on open
  useEffect(() => {
    if (isOpen && showLinks) {
      const firstLink = menuRef.current?.querySelector<HTMLAnchorElement>('a:not([aria-disabled="true"])');
      firstLink?.focus();
    }
  }, [isOpen, showLinks]);

  const closedSize = 40;
  const openSize = 280;
  const radius = 0; // no rounding on either state

  return (
    <>
      <div
        ref={buttonRef}
        role="button"
        tabIndex={0}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="hamburger-menu"
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMenu();
          }
        }}
        style={{
          width: closedSize,
          height: closedSize,
        }}
        className="relative flex items-center justify-center pointer-events-auto shrink-0"
      >
        {/* Background box - scales from top-right corner */}
        <m.div
          className="flex items-center justify-center bg-black/25 max-md:bg-black/60"
          style={{
            width: closedSize,
            height: closedSize,
            transformOrigin: "top right",
            borderRadius: radius,
          }}
          animate={{
            scaleX: isOpen ? openSize / closedSize : 1,
            scaleY: isOpen ? openSize / closedSize : 1,
            borderRadius: radius,
          }}
          transition={{
            duration: isReducedMotion ? 0 : 0.5,
            ease: "easeInOut",
          }}
        />

        {/* Menu links - sibling to background, NOT scaled */}
        {isOpen && (
          <m.div
            id="hamburger-menu"
            ref={menuRef}
            role="menu"
            className="absolute top-0 right-0 w-[280px] h-[280px] flex flex-col items-start justify-start pl-8 pr-0 pt-10"
            style={{
              transformOrigin: "top right",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showLinks ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReducedMotion ? 0 : 0.2, delay: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-3 w-full max-w-xs" aria-label="Navigation">
              {NAV_LINKS.map((link, index) => (
                <m.a
                  key={link.label}
                  href={link.href}
                  role="menuitem"
                  aria-disabled={link.disabled ?? false}
                  tabIndex={link.disabled ? -1 : 0}
                  className={`
                    flex items-center justify-start gap-4
                    font-mono text-sm uppercase tracking-[0.1em]
                    rounded px-4 py-2 transition-colors
                    ${link.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-white hover:text-[#4B7CD3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B7CD3]"
                    }
                  `}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{
                    duration: isReducedMotion ? 0 : 0.15,
                    delay: 0.35 + index * 0.05,
                  }}
                >
                  {link.label}
                  {link.comingSoon && (
                    <span
                      className="text-xs uppercase tracking-[0.05em] bg-[#4B7CD3] text-white px-2 py-0.5 rounded"
                      aria-hidden="true"
                    >
                      coming soon
                    </span>
                  )}
                </m.a>
              ))}
            </nav>
          </m.div>
        )}

        {/* Hamburger / X icon - always on top, inside button */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <m.div
              key="close"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hover:cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X width={24} height={24} strokeWidth={2} stroke={WHITE} />
            </m.div>
          ) : (
            <m.div
              key="menu"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hover:cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu width={24} height={24} strokeWidth={2} stroke={WHITE} />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
