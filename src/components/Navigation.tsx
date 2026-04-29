"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  id: string;
  number: string;
  label: string;
  labelJp: string;
}

const navItems: NavItem[] = [
  { id: "hero", number: "01", label: "HERO", labelJp: "ヒーロー" },
  { id: "systems", number: "02", label: "SYSTEMS", labelJp: "システム" },
  { id: "worlds", number: "03", label: "WORLDS", labelJp: "世界" },
  { id: "interfaces", number: "04", label: "INTERFACES", labelJp: "インターフェース" },
  { id: "archives", number: "05", label: "ARCHIVES", labelJp: "アーカイブ" },
];

interface NavigationProps {
  onOpenChange?: (isOpen: boolean) => void;
  onCategoryChange?: (category: string) => void;
  isMobile?: boolean;
  isLandscape?: boolean;
}

export default function Navigation({ 
  onOpenChange, 
  onCategoryChange,
  isMobile = false,
  isLandscape = false
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");

  const toggleNav = useCallback((newState: boolean) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
  }, [onOpenChange]);

  const changeCategory = useCallback((categoryId: string) => {
    setActiveId(categoryId);
    onCategoryChange?.(categoryId);
  }, [onCategoryChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggleNav(false);
        return;
      }

      if (!isOpen) return;

      const currentIndex = navItems.findIndex((item) => item.id === activeId);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            // Only change active visual state, don't navigate yet
            setActiveId(navItems[currentIndex - 1].id);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < navItems.length - 1) {
            setActiveId(navItems[currentIndex + 1].id);
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          // Now navigate to the selected category
          changeCategory(activeId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeId, changeCategory, toggleNav]);

  // Calculate responsive nav width - contained within CRT panel
  const getNavWidth = () => {
    if (isMobile) {
      return isLandscape ? "min(260px, 35vw)" : "min(240px, 65vw)";
    }
    return "min(340px, 22vw)";
  };

  const navWidth = getNavWidth();

  // Mobile overlay mode: nav appears on top of content
  // Desktop mode: nav sits beside content
  const useOverlayMode = isMobile;

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {useOverlayMode && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleNav(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
            style={{
              // Only cover the CRT panel area
              top: "var(--header-height, 4rem)",
              bottom: "var(--stripe-height, 3px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Navigation container - now contained within CRT panel bounds */}
      {/* On mobile when closed, disable pointer events to allow interaction with content underneath */}
      <div
        className={`absolute z-30 flex flex-col justify-between ${
          useOverlayMode
            ? "top-2 bottom-2 left-2"
            : "top-2 md:top-3 lg:top-4 bottom-2 md:bottom-3 lg:bottom-4 left-2 sm:left-3 md:left-4 lg:left-6"
        } ${useOverlayMode && !isOpen ? "pointer-events-none" : ""}`}
        style={{
          // Ensure nav stays within the CRT panel
          maxHeight: "calc(100% - 1rem)",
        }}
      >
        {/* Navigation Container - Morphs from scanlines to full nav */}
        <div className="relative flex flex-col gap-1.5 md:gap-2 flex-1 overflow-hidden">
          {/* Full-area hit target when closed — makes gaps between scanlines clickable */}
          {!isOpen && (
            <button
              className={`absolute inset-0 z-10 ${useOverlayMode ? "pointer-events-auto" : ""}`}
              onClick={() => toggleNav(true)}
              aria-label="Open navigation"
              tabIndex={-1}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            />
          )}
          {navItems.map((item, index) => {
            const isActive = item.id === activeId;

            return (
              <motion.button
                key={item.id}
                layoutId={`nav-item-${item.id}`}
                onClick={() => {
                  if (!isOpen) {
                    toggleNav(true);
                  } else {
                    changeCategory(item.id);
                    if (isMobile) {
                      toggleNav(false);
                    }
                  }
                }}
                className={`relative overflow-hidden ${
                  isActive && isOpen
                    ? "bg-blood-orange"
                    : "bg-blood-orange/40 backdrop-blur-sm"
                } ${
                  isOpen ? "rounded-xl md:rounded-2xl" : "rounded-full"
                } transition-colors ${useOverlayMode && !isOpen ? "pointer-events-auto" : ""}`}
                style={{
                  width: isOpen ? navWidth : "min(280px, 55vw)",
                  flex: isOpen ? (isActive ? "2" : "1") : "0 0 clamp(8px, 1.5vh, 12px)",
                  boxShadow: isOpen
                    ? isActive
                      ? "0 6px 20px rgba(236, 86, 59, 0.4)"
                      : "0 3px 10px rgba(0, 0, 0, 0.2)"
                    : "0 2px 6px rgba(236, 86, 59, 0.3)",
                }}
                initial={false}
                transition={{
                  type: "spring",
                  damping: 28,
                  stiffness: 320,
                  mass: 0.6,
                }}
                whileHover={
                  isOpen
                    ? { scale: isActive ? 1 : 1.02 }
                    : { scaleX: 1.05, opacity: 1 }
                }
                whileTap={{ scale: 0.98 }}
              >
                {/* Scanline State (Closed) - Animation only when closed */}
                {!isOpen && (
                  <motion.div
                    key={`scanline-${item.id}`}
                    animate={{
                      opacity: item.id === activeId ? [0.85, 1, 0.85] : [0.5, 0.7, 0.5],
                      scaleX: [1, 1.04, 1],
                    }}
                    transition={{
                      opacity: {
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut",
                      },
                      scaleX: {
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut",
                      },
                    }}
                    className={`absolute inset-0 rounded-full ${
                      item.id === activeId ? "bg-blood-orange" : "bg-blood-orange/60"
                    }`}
                  />
                )}

                {/* Full Nav Item State (Open) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-1.5 md:p-3"
                    >
                      {/* Number Badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          damping: 22,
                          stiffness: 400,
                          delay: 0.05,
                        }}
                        className={`mb-0.5 md:mb-1.5 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-lg md:rounded-xl ${
                          isActive
                            ? "bg-peacock-blue text-cream"
                            : "bg-peacock-blue/40 text-cream/80"
                        } text-sm sm:text-base md:text-lg lg:text-xl font-black border-2 ${
                          isActive ? "border-peacock-blue" : "border-teal/0"
                        }`}
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {item.number}
                      </motion.div>

                      {/* Label */}
                      <div className="flex flex-col items-center gap-0">
                        <motion.span
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 }}
                          className="text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-wide text-cream"
                          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                        >
                          {item.label}
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isActive ? 1 : 0.7 }}
                          transition={{ delay: 0.1 }}
                          className={`text-[8px] sm:text-[10px] tracking-wider ${
                            isActive ? "text-cream/90" : "text-cream/80"
                          }`}
                          style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
                        >
                          {item.labelJp}
                        </motion.span>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            damping: 18,
                            stiffness: 400,
                            delay: 0.08,
                          }}
                          className="absolute top-1.5 md:top-2 right-1.5 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-gold rounded-full"
                          style={{
                            boxShadow: "0 0 10px rgba(250, 219, 104, 0.6)",
                          }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Close Button & Footer - Only visible when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ delay: 0.15, duration: 0.15 }}
              className="flex flex-col gap-1.5 py-2 md:py-3"
            >
              <button
                onClick={() => toggleNav(false)}
                className="py-1.5 md:py-2 lg:py-3 bg-peacock-blue/60 backdrop-blur-sm hover:bg-peacock-blue/80 rounded-lg md:rounded-xl border border-teal/40 hover:border-aquamarine transition-all text-aquamarine font-black text-xs md:text-sm"
                style={{ 
                  fontFamily: "var(--font-fk-grotesk-black)",
                  width: navWidth
                }}
              >
                CLOSE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
