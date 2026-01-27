"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { heroKeywords, getRandomFact, HeroKeyword } from "@/lib/keywords";
import { seededRandom } from "@/lib/utils";

interface HeroSectionProps {
  isMobile?: boolean;
  isLandscape?: boolean;
}

// Persona 5 style spring config - snappy with overshoot
const persona5Spring = {
  type: "spring" as const,
  damping: 12,
  stiffness: 400,
  mass: 0.8,
};

// Aggressive spring for balloon entrance
const balloonSpring = {
  type: "spring" as const,
  damping: 15,
  stiffness: 500,
  mass: 0.5,
};

// UX constraint styles to prevent unwanted interactions
const noInteractionStyles: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  touchAction: "manipulation",
};

export default function HeroSection({ isMobile = false, isLandscape = false }: HeroSectionProps) {
  const [activeKeywordIndex, setActiveKeywordIndex] = useState(0);
  const [hoveredKeywordIndex, setHoveredKeywordIndex] = useState<number | null>(null);
  const [showBalloon, setShowBalloon] = useState(false);
  const [currentFact, setCurrentFact] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const glitchTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const lastInteractionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize lastInteractionRef on mount
  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // Cleanup glitch timeouts on unmount
  useEffect(() => {
    return () => {
      glitchTimeoutsRef.current.forEach(clearTimeout);
      glitchTimeoutsRef.current = [];
    };
  }, []);
  
  // Calculate if we're viewing a hovered keyword (takes priority over active)
  const displayedKeywordIndex = hoveredKeywordIndex ?? activeKeywordIndex;
  const displayedKeyword = heroKeywords[displayedKeywordIndex];

  // Auto-rotation logic
  const AUTO_ROTATE_DELAY = 5000; // 5 seconds of inactivity before auto-rotate

  const triggerChannelZap = useCallback((newIndex: number) => {
    // Clear any existing glitch timeouts
    glitchTimeoutsRef.current.forEach(clearTimeout);
    glitchTimeoutsRef.current = [];
    
    setIsTransitioning(true);
    setGlitchIntensity(1);
    
    // Quick glitch sequence with cleanup tracking
    const t1 = setTimeout(() => setGlitchIntensity(0.7), 50);
    const t2 = setTimeout(() => setGlitchIntensity(0.3), 100);
    const t3 = setTimeout(() => setGlitchIntensity(0.8), 150);
    const t4 = setTimeout(() => {
      setGlitchIntensity(0);
      setActiveKeywordIndex(newIndex);
      setIsTransitioning(false);
    }, 250);
    
    glitchTimeoutsRef.current = [t1, t2, t3, t4];
  }, []);

  // Auto-rotate when user is inactive
  useEffect(() => {
    const checkAndRotate = () => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      
      if (timeSinceLastInteraction >= AUTO_ROTATE_DELAY && hoveredKeywordIndex === null) {
        const nextIndex = (activeKeywordIndex + 1) % heroKeywords.length;
        triggerChannelZap(nextIndex);
      }
    };

    autoRotateTimeoutRef.current = setInterval(checkAndRotate, 1000);

    return () => {
      if (autoRotateTimeoutRef.current) {
        clearInterval(autoRotateTimeoutRef.current);
      }
    };
  }, [activeKeywordIndex, hoveredKeywordIndex, triggerChannelZap]);

  // Handle keyword hover/tap
  const handleKeywordInteraction = useCallback((index: number) => {
    lastInteractionRef.current = Date.now();
    setHoveredKeywordIndex(index);
    setCurrentFact(getRandomFact(heroKeywords[index].id));
    setShowBalloon(true);
  }, []);

  // Handle keyword leave
  const handleKeywordLeave = useCallback(() => {
    setHoveredKeywordIndex(null);
    setShowBalloon(false);
  }, []);

  // Handle direct click to change active keyword
  const handleKeywordClick = useCallback((index: number) => {
    lastInteractionRef.current = Date.now();
    if (index !== activeKeywordIndex) {
      triggerChannelZap(index);
    }
  }, [activeKeywordIndex, triggerChannelZap]);

  // Calculate balloon position based on layout
  const getBalloonPosition = () => {
    if (isMobile && !isLandscape) {
      // Portrait mobile: balloon appears below
      return { x: 0, y: 80 };
    }
    // Desktop/Landscape: balloon appears to the side
    return { x: isMobile ? 120 : 200, y: 0 };
  };

  // Calculate keyword shift when balloon is shown
  const getKeywordShift = () => {
    if (!showBalloon) return { x: 0, y: 0 };
    
    if (isMobile && !isLandscape) {
      // Portrait mobile: keyword shifts up
      return { x: 0, y: -30 };
    }
    // Desktop/Landscape: keyword shifts left (reduced to avoid going off-screen)
    return { x: isMobile ? -40 : -60, y: 0 };
  };

  const balloonPosition = getBalloonPosition();
  const keywordShift = getKeywordShift();

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden pl-4 sm:pl-8 md:pl-12 lg:pl-16"
      style={noInteractionStyles}
    >
      {/* Glitch overlay during channel zap */}
      <AnimatePresence>
        {glitchIntensity > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: glitchIntensity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          >
            {/* Horizontal scan distortion */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(236, 86, 59, ${glitchIntensity * 0.3}) 2px,
                  rgba(236, 86, 59, ${glitchIntensity * 0.3}) 4px
                )`,
              }}
              animate={{
                y: [0, -10, 5, -8, 0],
                scaleY: [1, 1.02, 0.98, 1.01, 1],
              }}
              transition={{ type: "tween", duration: 0.2 }}
            />
            
            {/* Color aberration bands */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`glitch-band-${i}`}
                className="absolute left-0 right-0 bg-cream/20"
                style={{
                  height: `${8 + seededRandom(i * 137.5) * 12}%`,
                  top: `${10 + i * 15}%`,
                }}
                animate={{
                  x: [(seededRandom(i * 247.1) - 0.5) * 30, 0],
                  opacity: [glitchIntensity, 0],
                }}
                transition={{ type: "tween", duration: 0.15, delay: i * 0.02 }}
              />
            ))}
            
            {/* Static noise flash */}
            <motion.div
              className="absolute inset-0 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
              animate={{
                opacity: [0.3 * glitchIntensity, 0],
              }}
              transition={{ type: "tween", duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keywords orbit/list around center */}
      <div className={`relative z-10 flex ${isMobile && !isLandscape ? "flex-col" : "flex-row"} items-center justify-center gap-2 sm:gap-3 md:gap-4`}>
        {/* Side keywords (before center) */}
        <div className={`flex ${isMobile && !isLandscape ? "flex-row" : "flex-col"} gap-1.5 sm:gap-2`}>
          {heroKeywords.slice(0, 3).map((keyword, index) => (
            <KeywordPill
              key={keyword.id}
              keyword={keyword}
              index={index}
              isActive={index === activeKeywordIndex}
              isHovered={index === hoveredKeywordIndex}
              onHover={() => handleKeywordInteraction(index)}
              onLeave={handleKeywordLeave}
              onClick={() => handleKeywordClick(index)}
            />
          ))}
        </div>

        {/* Center keyword display */}
        <motion.div
          className="relative mx-2 sm:mx-4 md:mx-8"
          animate={{
            x: keywordShift.x,
            y: keywordShift.y,
          }}
          transition={persona5Spring}
        >
          <CenterKeyword
            keyword={displayedKeyword}
            isTransitioning={isTransitioning}
            glitchIntensity={glitchIntensity}
          />

          {/* Persona 5 style balloon */}
          <AnimatePresence>
            {showBalloon && currentFact && (
              <Balloon
                fact={currentFact}
                position={balloonPosition}
                isMobile={isMobile}
                isLandscape={isLandscape}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Side keywords (after center) */}
        <div className={`flex ${isMobile && !isLandscape ? "flex-row" : "flex-col"} gap-1.5 sm:gap-2`}>
          {heroKeywords.slice(3).map((keyword, index) => (
            <KeywordPill
              key={keyword.id}
              keyword={keyword}
              index={index + 3}
              isActive={index + 3 === activeKeywordIndex}
              isHovered={index + 3 === hoveredKeywordIndex}
              onHover={() => handleKeywordInteraction(index + 3)}
              onLeave={handleKeywordLeave}
              onClick={() => handleKeywordClick(index + 3)}
            />
          ))}
        </div>
      </div>

      {/* Decorative elements - scanlines around edges */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner accents */}
        <motion.div
          className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blood-orange/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blood-orange/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blood-orange/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-blood-orange/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
      </div>
    </div>
  );
}

// Keyword pill component
interface KeywordPillProps {
  keyword: HeroKeyword;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function KeywordPill({
  keyword,
  index,
  isActive,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: KeywordPillProps) {
  return (
    <motion.button
      className={`relative px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg overflow-hidden ${
        isActive 
          ? "bg-blood-orange text-cream" 
          : isHovered 
            ? "bg-blood-orange/60 text-cream"
            : "bg-peacock-blue/40 text-cream/70 hover:text-cream"
      }`}
      style={{
        ...noInteractionStyles,
        fontFamily: "var(--font-fk-grotesk-black)",
        boxShadow: isActive 
          ? "0 4px 20px rgba(236, 86, 59, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
          : isHovered
            ? "0 4px 16px rgba(236, 86, 59, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.05 : 1,
        y: 0,
        rotate: isHovered ? (seededRandom(index * 137.5) - 0.5) * 3 : 0,
      }}
      transition={{
        ...persona5Spring,
        delay: index * 0.08,
      }}
      whileTap={{ scale: 0.95 }}
      draggable={false}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Label */}
      <span className="relative text-[10px] sm:text-xs md:text-sm font-black tracking-wider">
        {keyword.label}
      </span>
      
      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ boxShadow: "0 0 8px rgba(250, 219, 104, 0.8)" }}
        />
      )}
    </motion.button>
  );
}

// Center keyword display
interface CenterKeywordProps {
  keyword: HeroKeyword;
  isTransitioning: boolean;
  glitchIntensity: number;
}

function CenterKeyword({ keyword, isTransitioning, glitchIntensity }: CenterKeywordProps) {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={{
        x: isTransitioning ? [-5, 8, -3, 0] : 0,
        filter: glitchIntensity > 0 
          ? `blur(${glitchIntensity * 2}px) saturate(${1 + glitchIntensity})` 
          : "blur(0px) saturate(1)",
      }}
      transition={{
        x: { type: "tween", duration: 0.2 },
        filter: { type: "tween", duration: 0.1 },
      }}
    >
      {/* Japanese label */}
      <motion.span
        className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-cream mb-1 sm:mb-2 md:mb-4"
        style={{ 
          fontFamily: "var(--font-8bit-darling)",
          textShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        key={`jp-${keyword.id}`}
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
        }}
        transition={persona5Spring}
      >
        {keyword.labelJp}
      </motion.span>

      {/* Main English label with scanline overlay */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
          }}
        />
        <motion.span
          className="relative text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-aquamarine tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em]"
          style={{ 
            fontFamily: "var(--font-fk-grotesk-black)",
            textShadow: "0 4px 20px rgba(78, 185, 159, 0.3)",
          }}
          key={`en-${keyword.id}`}
          initial={{ opacity: 0, x: 30, skewX: -10 }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            skewX: 0,
          }}
          transition={persona5Spring}
        >
          {keyword.label}
        </motion.span>
      </div>
    </motion.div>
  );
}

// Persona 5 style speech balloon
interface BalloonProps {
  fact: string;
  position: { x: number; y: number };
  isMobile: boolean;
  isLandscape: boolean;
}

function Balloon({ fact, position, isMobile, isLandscape }: BalloonProps) {
  // Determine tail direction based on position
  const tailDirection = isMobile && !isLandscape ? "top" : "left";
  
  return (
    <motion.div
      className="absolute z-40 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transformOrigin: tailDirection === "top" ? "top center" : "left center",
      }}
      initial={{ 
        opacity: 0, 
        scale: 0.3,
        rotate: tailDirection === "left" ? -15 : 10,
        x: tailDirection === "left" ? -30 : 0,
        y: tailDirection === "top" ? -20 : 0,
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: 0,
        x: 0,
        y: 0,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5,
        rotate: tailDirection === "left" ? 10 : -10,
        x: tailDirection === "left" ? 20 : 0,
        y: tailDirection === "top" ? 10 : 0,
      }}
      transition={balloonSpring}
    >
      {/* Main balloon body */}
      <div 
        className="relative bg-cream text-peacock-blue px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl max-w-[200px] sm:max-w-[250px] md:max-w-[320px]"
        style={{
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -2px 0 rgba(0, 0, 0, 0.05)
          `,
          border: "3px solid var(--blood-orange)",
        }}
      >
        {/* Inner glow effect */}
        <div 
          className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, rgba(236, 86, 59, 0.1), transparent 60%)",
          }}
        />
        
        {/* Balloon text */}
        <motion.p
          className="relative text-xs sm:text-sm md:text-base font-bold leading-tight"
          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {fact}
        </motion.p>

        {/* Decorative corner accent */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ boxShadow: "0 0 8px rgba(250, 219, 104, 0.6)" }}
        />
      </div>

      {/* Balloon tail - Persona 5 style angular */}
      <motion.div
        className="absolute"
        style={{
          ...(tailDirection === "left" 
            ? { left: -12, top: "50%", marginTop: -10 }
            : { top: -12, left: "50%", marginLeft: -10 }
          ),
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.05, ...balloonSpring }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24"
          style={{
            transform: tailDirection === "left" ? "rotate(0deg)" : "rotate(90deg)",
          }}
        >
          <path
            d="M24 12 L0 0 L6 12 L0 24 Z"
            fill="var(--cream)"
            stroke="var(--blood-orange)"
            strokeWidth="3"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
