"use client";

import { useState, useEffect } from "react";
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
}

export default function Navigation({ onOpenChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");

  const toggleNav = (newState: boolean) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

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
          console.log(`Navigating to: ${activeId}`);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeId]);

  return (
    <div className="fixed top-[6.5rem] bottom-[2rem] left-[2.5rem] z-50 flex flex-col justify-between">
      {/* Navigation Container - Morphs from scanlines to full nav */}
      <div className="flex flex-col gap-3 flex-1">
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
                setActiveId(item.id);
              }}
              className={`relative overflow-hidden ${
                isActive && isOpen
                  ? "bg-blood-orange"
                  : "bg-blood-orange/40 backdrop-blur-sm"
              } ${
                isOpen ? "rounded-2xl" : "rounded-full"
              } transition-colors`}
              style={{
                width: "400px",
                flex: isOpen ? (isActive ? "2" : "1") : "0 0 15px",
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
                    className="absolute inset-0 flex flex-col items-center justify-center p-4"
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
                      className={`mb-2 w-14 h-14 flex items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-peacock-blue text-cream"
                          // : "bg-dark-teal/80 text-aquamarine"
                          : "bg-peacock-blue/40 text-cream/80"
                      } text-2xl font-black border-2 ${
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
                        className={`text-xl font-black tracking-wide ${
                          isActive ? "text-cream" : "text-cream"
                        }`}
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {item.label}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isActive ? 1 : 0.7 }}
                        transition={{ delay: 0.2 }}
                        className={`text-xs tracking-wider ${
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
                        className="absolute top-3 right-3 w-3 h-3 bg-gold rounded-full"
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
        className="flex flex-col gap-2 py-5"
          >
        <button
          onClick={() => toggleNav(false)}
          className="w-[400px] py-4 bg-peacock-blue/60 backdrop-blur-sm hover:bg-peacock-blue/80 rounded-xl border border-teal/40 hover:border-aquamarine transition-all text-aquamarine font-black text-sm"
          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
        >
          CLOSE
        </button>
        {/* <div
          className="w-[400px] text-aquamarine/40 text-xs text-center tracking-wider"
          style={{ fontFamily: "var(--font-8bit-darling)" }}
        >
          原初のルーン
        </div> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
