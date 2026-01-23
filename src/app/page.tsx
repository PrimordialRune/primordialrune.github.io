"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Top NES Stripe */}
      <div className="fixed top-0 left-0 right-0 h-3 bg-blood-orange z-50" />

      {/* Header */}
      <header className="fixed top-3 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 554.72 555"
            className="flex-shrink-0"
          >
            <g>
              <path
                fill="var(--peacock-blue)"
                d="M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z"
              />
            </g>
            <g>
              <path
                fill="var(--blood-orange)"
                d="M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z"
              />
            </g>
          </svg>
          <div className="flex items-center gap-2">
            <span
              className="text-3xl font-black text-blood-orange italic leading-none"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              PRIMORDIAL
            </span>
            <span
              className="text-3xl font-black text-peacock-blue italic leading-none"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              RUNE
            </span>
          </div>
        </div>

        {/* Secondary Nav */}
        <div className="flex gap-3">
          <button
            className="px-5 py-2 border-2 border-blood-orange text-blood-orange rounded-lg font-black text-sm hover:bg-blood-orange hover:text-cream transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            DISCOVER
          </button>
          <button
            className="px-5 py-2 border-2 border-blood-orange text-blood-orange rounded-lg font-black text-sm hover:bg-blood-orange hover:text-cream transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            ABOUT ME
          </button>
        </div>
      </header>

      {/* Navigation */}
      <Navigation onOpenChange={setNavOpen} />

      {/* Main Content Area (CRT Panel) */}
      <main className="fixed inset-0 pt-[5.5rem] pb-8 px-6 flex justify-center items-center">
        <div className="relative w-full h-full">
          {/* CRT Display Panel with Embossing */}
          <div
            className="relative w-full h-full bg-panel-bg rounded-3xl overflow-hidden"
            style={{
              boxShadow: `
                inset 6px 6px 12px rgba(0, 0, 0, 0.4),
                inset -6px -6px 12px rgba(255, 255, 255, 0.05),
                0 0 0 4px var(--teal),
                0 8px 24px rgba(0, 0, 0, 0.3)
              `,
            }}
          >
            {/* Scanline Effect Overlay - Animated */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                  animation: "scanlines 8s linear infinite",
                }}
              />
            </div>

            {/* Content - Shifts when nav is open */}
            <motion.div
              className="relative z-10 w-full h-full flex flex-col items-center justify-center"
              animate={{
                paddingLeft: navOpen ? "420px" : "0px",
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 250,
                mass: 0.8,
              }}
            >
              <h1
                className="text-9xl font-black text-cream mb-6 leading-none"
                style={{ fontFamily: "var(--font-8bit-darling)" }}
              >
                デザイン
              </h1>
              <div className="relative">
                {/* Scanline overlay specifically for DESIGN text */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.15]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                  }}
                />
                <p
                  className="relative text-5xl font-black text-aquamarine tracking-[0.3em]"
                  style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                >
                  DESIGN
                </p>
              </div>
            </motion.div>

            {/* Footer Signature - Larger */}
            <div
              className="absolute bottom-8 right-10 text-aquamarine/40 text-lg tracking-wider"
              style={{ fontFamily: "var(--font-8bit-darling)" }}
            >
              原初のルーン
            </div>
          </div>
        </div>
      </main>

      {/* Bottom NES Stripe */}
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-blood-orange z-50" />

      {/* CSS Animation for Scanlines */}
      <style jsx>{`
        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </div>
  );
}
