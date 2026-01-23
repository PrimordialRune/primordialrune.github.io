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
            changeCategory(navItems[currentIndex - 1].id);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < navItems.length - 1) {
            changeCategory(navItems[currentIndex + 1].id);
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          // Category is already active, do nothing
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeId, changeCategory, toggleNav]);

  // Calculate responsive nav width
  const getNavWidth = () => {
    if (isMobile) {
      return isLandscape ? "min(300px, 40vw)" : "min(280px, 75vw)";
    }
    return "min(400px, 25vw)";
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <div 
        className={`fixed z-50 flex flex-col justify-between ${
          useOverlayMode 
            ? "top-14 sm:top-16 bottom-4 left-2 sm:left-4" 
            : "top-[5rem] md:top-[5.5rem] lg:top-[6rem] bottom-4 md:bottom-6 lg:bottom-8 left-2 sm:left-4 md:left-6 lg:left-10"
        }`}
      >
        {/* Navigation Container - Morphs from scanlines to full nav */}
        <div className="flex flex-col gap-2 md:gap-3 flex-1">
          {navItems.map((item, index) => {
            const isActive = item.id === activeId;

            return (
              <motion.button
                key={item.id}
                layoutId={`nav-item-${item.id}`}
                onClick={() => {
                  if (!isOpen) {
                    toggleNav(true);
                  }
                  changeCategory(item.id);
                  // On mobile, close nav after selecting
                  if (isMobile && isOpen) {
                    toggleNav(false);
                  }
                }}
                className={`relative overflow-hidden ${
                  isActive && isOpen
                    ? "bg-blood-orange"
                    : "bg-blood-orange/40 backdrop-blur-sm"
                } ${
                  isOpen ? "rounded-xl md:rounded-2xl" : "rounded-full"
                } transition-colors`}
                style={{
                  width: isOpen ? navWidth : "min(300px, 60vw)",
                  flex: isOpen ? (isActive ? "2" : "1") : "0 0 clamp(10px, 2vh, 15px)",
                  boxShadow: isOpen
                    ? isActive
                      ? "0 8px 24px rgba(236, 86, 59, 0.4)"
                      : "0 4px 12px rgba(0, 0, 0, 0.2)"
                    : "0 2px 8px rgba(236, 86, 59, 0.3)",
                }}
                initial={false}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 250,
                  mass: 0.8,
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
                      opacity: [0.7, 1, 0.7],
                      scaleX: [1, 1.05, 1],
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
                    className="absolute inset-0 bg-blood-orange rounded-full"
                  />
                )}

                {/* Full Nav Item State (Open) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-2 md:p-4"
                    >
                      {/* Number Badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                          delay: 0.1,
                        }}
                        className={`mb-1 md:mb-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-lg md:rounded-xl ${
                          isActive
                            ? "bg-peacock-blue text-cream"
                            : "bg-peacock-blue/40 text-cream/80"
                        } text-base sm:text-lg md:text-xl lg:text-2xl font-black border-2 ${
                          isActive ? "border-peacock-blue" : "border-teal/0"
                        }`}
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {item.number}
                      </motion.div>

                      {/* Label */}
                      <div className="flex flex-col items-center gap-0.5">
                        <motion.span
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-wide text-cream"
                          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                        >
                          {item.label}
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isActive ? 1 : 0.7 }}
                          transition={{ delay: 0.2 }}
                          className={`text-[10px] sm:text-xs tracking-wider ${
                            isActive ? "text-cream/90" : "text-cream/80"
                          }`}
                          style={{ fontFamily: "var(--font-8bit-darling)" }}
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
                            damping: 15,
                            stiffness: 300,
                            delay: 0.15,
                          }}
                          className="absolute top-2 md:top-3 right-2 md:right-3 w-2 h-2 md:w-3 md:h-3 bg-gold rounded-full"
                          style={{
                            boxShadow: "0 0 12px rgba(250, 219, 104, 0.6)",
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-2 py-3 md:py-5"
            >
              <button
                onClick={() => toggleNav(false)}
                className="py-2 md:py-3 lg:py-4 bg-peacock-blue/60 backdrop-blur-sm hover:bg-peacock-blue/80 rounded-lg md:rounded-xl border border-teal/40 hover:border-aquamarine transition-all text-aquamarine font-black text-xs md:text-sm"
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
