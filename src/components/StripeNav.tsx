"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { sections } from "@/lib/sections";

interface StripeNavProps {
  activeId: string;
  onSelect: (id: string) => void;
}

// NES-stripe navigation on the console's bezel. A vertical rail beside the
// tube in landscape, a bottom tab bar in portrait (layout lives in CSS).
// Inactive sections are bare stripes; the active one widens into a
// cartridge label with its number, name and katakana.
export default function StripeNav({ activeId, onSelect }: StripeNavProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    const back = e.key === "ArrowUp" || e.key === "ArrowLeft";
    if (!forward && !back) return;
    e.preventDefault();
    e.stopPropagation();
    const next = (index + (forward ? 1 : -1) + sections.length) % sections.length;
    buttonRefs.current[next]?.focus();
    onSelect(sections[next].id);
  };

  return (
    <nav className="stripe-nav" aria-label="Sections">
      {sections.map((section, index) => {
        const isActive = section.id === activeId;
        return (
          <motion.button
            key={section.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            layout
            transition={{ type: "spring", damping: 25, stiffness: 250, mass: 0.8 }}
            className="stripe-btn"
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
            aria-label={`${section.number} ${section.label}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(section.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{ "--stripe-i": index } as React.CSSProperties}
          >
            <span className="stripe-num">{section.number}</span>
            <span className="stripe-bar" aria-hidden="true">
              {isActive && (
                <motion.span
                  className="stripe-label"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.18 }}
                >
                  <b>{section.label}</b>
                  <small>{section.labelJp}</small>
                </motion.span>
              )}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
