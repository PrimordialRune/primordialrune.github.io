"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// More aggressive spring for speech bubbles
const bubbleSpring = {
  type: "spring" as const,
  damping: 10,
  stiffness: 500,
  mass: 0.4,
};

// UX constraint styles
const noInteractionStyles: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  touchAction: "manipulation",
};

// Design superpowers data
const superpowers = [
  {
    id: "asymmetry",
    power: "ASYMMETRY",
    powerJp: "非対称",
    icon: "⚔️",
    description: "* the art of giving each player a unique experience",
  },
  {
    id: "strategy", 
    power: "STRATEGY",
    powerJp: "戦略",
    icon: "🎯",
    description: "* turning simple rules into infinite possibilities",
  },
  {
    id: "nostalgia",
    power: "NOSTALGIA",
    powerJp: "郷愁",
    icon: "🕹️",
    description: "* pixels that hit different... you know?",
  },
  {
    id: "roleplay",
    power: "ROLEPLAY",
    powerJp: "役割",
    icon: "⭐",
    description: "* because numbers going up = serotonin",
  },
  {
    id: "paragame",
    power: "PARAGAME",
    powerJp: "超越",
    icon: "🌀",
    description: "* games about games... meta, right?",
  },
  {
    id: "modularity",
    power: "MODULARITY",
    powerJp: "模組",
    icon: "🧩",
    description: "* infinite combinations from finite pieces",
  },
];

// Sans-style dialogues - fourth wall breaking, friendly
const dialogues = {
  intro: [
    "* oh hey. you actually clicked on something.",
    "* welcome to my corner of the internet.",
    "* i make games. or try to, anyway.",
    "* stick around if you want. no pressure.",
  ],
  powers: [
    "* these are my design superpowers.",
    "* sounds dramatic, huh? blame the theme.",
    "* each one's a different way i approach game design.",
    "* hover around. discover stuff. that's the point.",
  ],
  contact: [
    "* wanna chat? i don't bite.",
    "* unless you're a bug. then i definitely bite.",
    "* pick your poison. i'm on most platforms.",
    "* or don't. free will and all that.",
  ],
  social: {
    twitter: "* tweets about games. sometimes complains about code.",
    telegram: "* for the brave souls who want real-time chaos.",
    instagram: "* occasional screenshots. very occasional.",
    github: "* where the magic happens. also the bugs.",
    email: "* old school. i respect that.",
  },
  idle: [
    "* still here? nice.",
    "* the cursor's looking lonely over there.",
    "* i wonder what happens if you click more stuff...",
    "* (nothing bad, i promise)",
    "* you're pretty patient, huh?",
  ],
};

// Social links
const socialLinks = [
  { id: "twitter", icon: "𝕏", url: "https://x.com/PrimordialRune", label: "Twitter/X" },
  { id: "telegram", icon: "✈", url: "https://t.me/PrimordialRune", label: "Telegram" },
  { id: "instagram", icon: "📷", url: "https://instagram.com/primordialrune", label: "Instagram" },
  { id: "github", icon: "⌨", url: "https://github.com/PrimordialRune", label: "GitHub" },
  { id: "email", icon: "✉", url: "mailto:primordialrune@gmail.com", label: "Email" },
];

export default function HeroSection({ isMobile = false, isLandscape = false }: HeroSectionProps) {
  const [currentDialogue, setCurrentDialogue] = useState(dialogues.intro[0]);
  const [showDialogue, setShowDialogue] = useState(true);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [discoveredPowers, setDiscoveredPowers] = useState<Set<string>>(new Set());
  const [interactionCount, setInteractionCount] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState("GAME DESIGNER");
  
  const dialogueIndexRef = useRef(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glitchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Glitch text effect - Cyberpunk style distortion
  const triggerGlitch = useCallback((targetText: string) => {
    setIsGlitching(true);
    const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?アイウエオカキクケコ";
    let iterations = 0;
    const maxIterations = 10;
    
    if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    
    glitchIntervalRef.current = setInterval(() => {
      setGlitchText(
        targetText
          .split("")
          .map((char, index) => {
            if (index < iterations) return targetText[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      
      iterations += 1;
      if (iterations > maxIterations) {
        if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
        setGlitchText(targetText);
        setIsGlitching(false);
      }
    }, 50);
  }, []);

  // Handle power discovery
  const handlePowerHover = useCallback((powerId: string) => {
    setActivePower(powerId);
    setDiscoveredPowers(prev => new Set([...prev, powerId]));
    setInteractionCount(prev => prev + 1);
    
    const power = superpowers.find(p => p.id === powerId);
    if (power) {
      setCurrentDialogue(power.description);
      setShowDialogue(true);
      triggerGlitch(power.power);
    }
    
    // Reset idle timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, [triggerGlitch]);

  const handlePowerLeave = useCallback(() => {
    setActivePower(null);
    triggerGlitch("GAME DESIGNER");
    
    // Start idle dialogue timer
    idleTimerRef.current = setTimeout(() => {
      const idleDialogue = dialogues.idle[Math.floor(Math.random() * dialogues.idle.length)];
      setCurrentDialogue(idleDialogue);
    }, 5000);
  }, [triggerGlitch]);

  // Handle social hover
  const handleSocialHover = useCallback((socialId: string) => {
    setHoveredSocial(socialId);
    const message = dialogues.social[socialId as keyof typeof dialogues.social];
    if (message) {
      setCurrentDialogue(message);
      setShowDialogue(true);
    }
  }, []);

  const handleSocialLeave = useCallback(() => {
    setHoveredSocial(null);
  }, []);

  // Initial dialogue cycle
  useEffect(() => {
    const timer = setInterval(() => {
      if (!activePower && !hoveredSocial) {
        dialogueIndexRef.current = (dialogueIndexRef.current + 1) % dialogues.intro.length;
        setCurrentDialogue(dialogues.intro[dialogueIndexRef.current]);
      }
    }, 8000);
    
    return () => {
      clearInterval(timer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    };
  }, [activePower, hoveredSocial]);

  // Handle power discovery milestones - moved to callback
  const handleDiscoveryMilestone = useCallback(() => {
    if (interactionCount === 3 && discoveredPowers.size < superpowers.length) {
      return "* nice! you found " + discoveredPowers.size + " powers. there's more...";
    }
    if (discoveredPowers.size === superpowers.length) {
      return "* wow, you found them all! you're thorough. i like that.";
    }
    return null;
  }, [interactionCount, discoveredPowers.size]);

  // Update dialogue on milestone changes via ref comparison
  const prevDiscoveredCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevDiscoveredCountRef.current;
    const currentCount = discoveredPowers.size;
    
    if (currentCount > prevCount) {
      const milestone = handleDiscoveryMilestone();
      if (milestone) {
        // Use timeout to avoid synchronous setState in effect
        const timer = setTimeout(() => setCurrentDialogue(milestone), 100);
        prevDiscoveredCountRef.current = currentCount;
        return () => clearTimeout(timer);
      }
    }
    prevDiscoveredCountRef.current = currentCount;
  }, [discoveredPowers.size, handleDiscoveryMilestone]);

  return (
    <div 
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={noInteractionStyles}
    >
      {/* Main content container */}
      <div className={`flex-1 flex ${isMobile && !isLandscape ? "flex-col" : "flex-row"} items-center justify-center gap-4 md:gap-8 p-4 md:p-8`}>
        
        {/* Left side - Main intro */}
        <div className="flex flex-col items-center md:items-start gap-4 md:gap-6 max-w-lg">
          
          {/* Glitch title */}
          <div className="relative">
            {/* Japanese text with lightning effect */}
            <motion.div
              className="text-lg sm:text-xl md:text-2xl text-cream/60 mb-2"
              style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
              animate={{
                textShadow: activePower ? [
                  "0 0 10px rgba(250, 219, 104, 0.8)",
                  "0 0 20px rgba(250, 219, 104, 0.4)",
                  "0 0 30px rgba(78, 185, 159, 0.6)",
                  "0 0 10px rgba(250, 219, 104, 0.8)",
                ] : "0 0 0px transparent",
              }}
              transition={{ duration: 0.3, repeat: activePower ? Infinity : 0, repeatType: "reverse" }}
            >
              {activePower 
                ? superpowers.find(p => p.id === activePower)?.powerJp 
                : "ゲームデザイナー"}
            </motion.div>
            
            {/* Main glitching title */}
            <motion.h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight ${
                isGlitching ? "text-blood-orange" : "text-aquamarine"
              }`}
              style={{ 
                fontFamily: "var(--font-fk-grotesk-black)",
                textShadow: isGlitching 
                  ? "2px 0 #ec563b, -2px 0 #4eb99f, 0 0 20px rgba(236, 86, 59, 0.5)"
                  : "0 4px 20px rgba(78, 185, 159, 0.3)",
              }}
              animate={{
                x: isGlitching ? [0, -3, 5, -2, 0] : 0,
                skewX: isGlitching ? [0, 2, -2, 1, 0] : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              {glitchText}
            </motion.h1>
            
            {/* Scanline overlay on text */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.1]"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 3px)",
                mixBlendMode: "overlay",
              }}
            />
          </div>

          {/* Persona 5 style speech bubble */}
          <AnimatePresence mode="wait">
            {showDialogue && (
              <SpeechBubble 
                key={currentDialogue}
                text={currentDialogue} 
              />
            )}
          </AnimatePresence>

          {/* Superpower discovery area */}
          <div className="mt-4">
            <motion.p 
              className="text-cream/40 text-xs mb-3 tracking-wider"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              [ DESIGN SUPERPOWERS ]
            </motion.p>
            
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
              {superpowers.map((power, index) => (
                <PowerOrb
                  key={power.id}
                  power={power}
                  index={index}
                  isActive={activePower === power.id}
                  isDiscovered={discoveredPowers.has(power.id)}
                  onHover={() => handlePowerHover(power.id)}
                  onLeave={handlePowerLeave}
                />
              ))}
            </div>
            
            {/* Progress indicator */}
            <motion.div 
              className="mt-3 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: discoveredPowers.size > 0 ? 1 : 0 }}
            >
              {superpowers.map((power) => (
                <motion.div
                  key={`progress-${power.id}`}
                  className={`w-2 h-2 rounded-full ${
                    discoveredPowers.has(power.id) ? "bg-gold" : "bg-cream/20"
                  }`}
                  animate={{
                    scale: discoveredPowers.has(power.id) ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: discoveredPowers.has(power.id) 
                      ? "0 0 8px rgba(250, 219, 104, 0.6)" 
                      : "none",
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right side - Contact section */}
        <div className={`flex flex-col items-center gap-4 ${isMobile && !isLandscape ? "mt-4" : ""}`}>
          <motion.p 
            className="text-cream/40 text-xs tracking-wider"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            [ SAY HELLO ]
          </motion.p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {socialLinks.map((social, index) => (
              <SocialButton
                key={social.id}
                social={social}
                index={index}
                isHovered={hoveredSocial === social.id}
                onHover={() => handleSocialHover(social.id)}
                onLeave={handleSocialLeave}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-4 left-4 w-12 h-12"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-full h-1 bg-blood-orange/40" />
          <div className="w-1 h-full bg-blood-orange/40" />
        </motion.div>
        <motion.div
          className="absolute top-4 right-4 w-12 h-12"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.75 }}
        >
          <div className="w-full h-1 bg-blood-orange/40" />
          <div className="w-1 h-full bg-blood-orange/40 ml-auto" />
        </motion.div>
        <motion.div
          className="absolute bottom-4 left-4 w-12 h-12"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        >
          <div className="w-1 h-full bg-blood-orange/40" />
          <div className="w-full h-1 bg-blood-orange/40 mt-auto" />
        </motion.div>
        <motion.div
          className="absolute bottom-4 right-4 w-12 h-12"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2.25 }}
        >
          <div className="w-1 h-full bg-blood-orange/40 ml-auto" />
          <div className="w-full h-1 bg-blood-orange/40 mt-auto" />
        </motion.div>
      </div>
    </div>
  );
}

// Persona 5 style speech bubble component
interface SpeechBubbleProps {
  text: string;
}

function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <motion.div
      className="relative max-w-sm"
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        y: 10,
        rotate: -3,
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        rotate: 0,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9, 
        y: -10,
        rotate: 2,
      }}
      transition={bubbleSpring}
    >
      {/* Main bubble */}
      <div 
        className="relative bg-cream px-4 py-3 md:px-5 md:py-4"
        style={{
          clipPath: "polygon(0 10%, 3% 0, 97% 0, 100% 10%, 100% 90%, 97% 100%, 3% 100%, 0 90%)",
          boxShadow: `
            4px 4px 0 var(--blood-orange),
            8px 8px 0 rgba(16, 47, 65, 0.3)
          `,
        }}
      >
        {/* Inner border effect */}
        <div 
          className="absolute inset-[3px] border-2 border-blood-orange/30 pointer-events-none"
          style={{
            clipPath: "polygon(0 10%, 3% 0, 97% 0, 100% 10%, 100% 90%, 97% 100%, 3% 100%, 0 90%)",
          }}
        />
        
        {/* Text with typewriter-ish styling */}
        <motion.p
          className="relative text-peacock-blue text-sm md:text-base font-bold leading-relaxed"
          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {text}
        </motion.p>
        
        {/* Decorative dots */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
          style={{ boxShadow: "0 0 10px rgba(250, 219, 104, 0.6)" }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-blood-orange rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 500 }}
        />
      </div>
      
      {/* Tail - angular Persona 5 style */}
      <motion.div
        className="absolute -bottom-3 left-6 w-0 h-0"
        style={{
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "16px solid var(--cream)",
          filter: "drop-shadow(2px 2px 0 var(--blood-orange))",
        }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, ...bubbleSpring }}
      />
    </motion.div>
  );
}

// Power orb component - discoverable superpower
interface PowerOrbProps {
  power: typeof superpowers[0];
  index: number;
  isActive: boolean;
  isDiscovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function PowerOrb({ power, index, isActive, isDiscovered, onHover, onLeave }: PowerOrbProps) {
  return (
    <motion.button
      className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl
        ${isActive 
          ? "bg-blood-orange text-cream" 
          : isDiscovered 
            ? "bg-peacock-blue/60 text-cream/80" 
            : "bg-peacock-blue/30 text-cream/40"
        }
      `}
      style={{
        boxShadow: isActive 
          ? "0 0 20px rgba(236, 86, 59, 0.6), 0 0 40px rgba(236, 86, 59, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
          : isDiscovered
            ? "0 0 10px rgba(78, 185, 159, 0.3), inset 0 2px 4px rgba(0,0,0,0.2)"
            : "inset 0 2px 4px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isActive ? 1.15 : 1,
        y: 0,
        rotate: isActive ? [0, -5, 5, 0] : 0,
      }}
      transition={{
        ...persona5Spring,
        delay: index * 0.1,
        rotate: { duration: 0.3, repeat: isActive ? Infinity : 0 },
      }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Icon */}
      <span className="relative z-10">{power.icon}</span>
      
      {/* Pulse ring when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      
      {/* Discovery sparkle */}
      {isDiscovered && !isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ boxShadow: "0 0 6px rgba(250, 219, 104, 0.8)" }}
        />
      )}
      
      {/* Undiscovered hint */}
      {!isDiscovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(250, 219, 104, 0.3), transparent 60%)",
          }}
        />
      )}
    </motion.button>
  );
}

// Social button component
interface SocialButtonProps {
  social: typeof socialLinks[0];
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function SocialButton({ social, index, isHovered, onHover, onLeave }: SocialButtonProps) {
  return (
    <motion.a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl
        ${isHovered 
          ? "bg-blood-orange text-cream" 
          : "bg-peacock-blue/40 text-cream/60 hover:text-cream"
        }
      `}
      style={{
        boxShadow: isHovered 
          ? "0 4px 20px rgba(236, 86, 59, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)"
          : "inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.1 : 1,
        y: isHovered ? -4 : 0,
      }}
      transition={{
        ...persona5Spring,
        delay: 3 + index * 0.1,
      }}
      whileTap={{ scale: 0.9 }}
    >
      <span className="relative z-10">{social.icon}</span>
      
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-peacock-blue text-cream text-xs rounded whitespace-nowrap"
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.8 }}
            transition={bubbleSpring}
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            {social.label}
            <div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-peacock-blue rotate-45"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
