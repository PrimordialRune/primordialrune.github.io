"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/crt";

// Standby screen and the classic CRT switch-on: a dot stretches into a
// horizontal line, then the line opens into the full picture.
export default function PowerOn({ onPowered }: { onPowered: () => void }) {
  const [phase, setPhase] = useState<"standby" | "line" | "open">("standby");
  const startedRef = useRef(false);

  const powerOn = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (prefersReducedMotion()) {
      onPowered();
      return;
    }
    setPhase("line");
  }, [onPowered]);

  // Enter/Space anywhere switches the TV on (also reached by the gamepad A button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        powerOn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [powerOn]);

  if (phase !== "standby") {
    return (
      <div className="power-screen">
        <motion.div
          className="power-beam"
          initial={{ scaleX: 0, scaleY: 0.006, opacity: 1 }}
          animate={
            phase === "line"
              ? { scaleX: 1, scaleY: 0.006, opacity: 1 }
              : { scaleX: 1, scaleY: 1, opacity: 0 }
          }
          transition={phase === "line" ? { duration: 0.22, ease: "easeOut" } : { duration: 0.36, ease: "easeIn" }}
          onAnimationComplete={() => {
            if (phase === "line") setPhase("open");
            else onPowered();
          }}
        />
      </div>
    );
  }

  return (
    <div className="power-screen" onClick={powerOn}>
      <button className="power-btn" onClick={powerOn} aria-label="Power on" autoFocus>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 3v8" />
          <path d="M6.3 6.8a8 8 0 1 0 11.4 0" />
        </svg>
      </button>
      <p className="power-hint">
        STANDBY <span className="power-hint-jp">たいき</span>
      </p>
    </div>
  );
}
