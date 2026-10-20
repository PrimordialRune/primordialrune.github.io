"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AstroidSparkle } from "@/components/AstroidSparkle";
import { seededRandom } from "@/lib/utils";

// Enhanced Discover Button Component with 3D tilt and magical effects
export default function DiscoverButton({ onDiscover, onAnimationStart }: { onDiscover: () => void; onAnimationStart?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  const handleClick = () => {
    setIsAnimating(true);
    onAnimationStart?.();
    // Trigger the animation sequence then call onDiscover
    setTimeout(() => {
      onDiscover();
      setIsAnimating(false);
    }, 500);
  };

  // Calculate 3D tilt based on mouse position
  const tiltX = isHovered ? (mousePosition.y - 0.5) * -20 : 0;
  const tiltY = isHovered ? (mousePosition.x - 0.5) * 20 : 0;

  // Generate sparkle positions with varying opacities using seeded random
  const sparkles = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      left: 10 + (i % 4) * 25 + seededRandom(i * 137.5) * 15,
      top: 20 + Math.floor(i / 4) * 25,
      delay: i * 0.1,
      opacity: 0.4 + seededRandom(i * 247.1) * 0.6,
      size: 6 + seededRandom(i * 317.3) * 6,
    }));
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      className="relative px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-black text-xs md:text-sm"
      style={{ 
        fontFamily: "var(--font-fk-grotesk-black)",
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      animate={{
        rotateX: tiltX,
        rotateY: tiltY,
        y: isHovered ? -4 : 0,
        boxShadow: isHovered 
          ? "0 12px 24px rgba(236, 86, 59, 0.5), 0 6px 12px rgba(236, 86, 59, 0.3)"
          : "0 4px 8px rgba(0, 0, 0, 0.2)",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileTap={{ scale: 0.95, y: 0 }}
    >
      {/* Background layers */}
      <motion.div
        className="absolute inset-0 border-2 border-blood-orange rounded-lg"
        animate={{
          borderColor: isHovered ? "var(--gold)" : "var(--blood-orange)",
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Animated background fill */}
      <motion.div
        className="absolute inset-0 bg-blood-orange rounded-lg origin-left"
        initial={{ scaleX: 0 }}
        animate={{ 
          scaleX: isHovered ? 1 : 0,
          backgroundColor: isAnimating ? "var(--gold)" : "var(--blood-orange)"
        }}
        transition={{ 
          scaleX: { duration: 0.3, ease: "easeOut" },
          backgroundColor: { duration: 0.2 }
        }}
      />

      {/* Scanline sweep effect on click */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            key="scanline-sweep"
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`scanline-${i}`}
                className="absolute left-0 right-0 h-[2px] bg-cream/80"
                style={{ top: `${10 + i * 12}%` }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ 
                  scaleX: [0, 1, 1, 0],
                  originX: [0, 0, 1, 1]
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.04,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dense Astroid sparkles on hover */}
      <AnimatePresence>
        {isHovered && !isAnimating && (
          <>
            {sparkles.map((sparkle) => (
              <motion.div
                key={`sparkle-${sparkle.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${sparkle.left}%`,
                  top: `${sparkle.top}%`,
                }}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ 
                  opacity: [0, sparkle.opacity, sparkle.opacity * 0.5, 0],
                  scale: [0, 1.2, 0.8, 0],
                  y: [-5, -15, -25, -35],
                  rotate: [0, 45, 90, 135],
                }}
                transition={{ 
                  duration: 1,
                  delay: sparkle.delay,
                  repeat: Infinity,
                  repeatDelay: 0.3
                }}
              >
                <AstroidSparkle size={sparkle.size} color="var(--gold)" opacity={1} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Button text */}
      <motion.span
        className="relative z-10 flex items-center gap-2"
        animate={{
          color: isHovered ? "var(--cream)" : "var(--blood-orange)",
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          animate={{
            x: isAnimating ? [0, 5, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          DISCOVER
        </motion.span>
        <motion.svg
          className="w-3.5 h-3.5 md:w-4 md:h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            x: isHovered ? 3 : 0,
            rotate: isAnimating ? 360 : 0,
          }}
          transition={{ 
            x: { duration: 0.2 },
            rotate: { duration: 0.5 }
          }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </motion.svg>
      </motion.span>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        animate={{
          boxShadow: isHovered 
            ? "0 0 20px rgba(250, 219, 104, 0.4), 0 0 40px rgba(236, 86, 59, 0.2)"
            : "0 0 0px rgba(250, 219, 104, 0)",
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

