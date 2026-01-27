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

// Design superpowers data with map positions
const superpowers = [
  {
    id: "asymmetry",
    power: "ASYMMETRY",
    powerJp: "非対称",
    icon: "⚔️",
    description: "* the art of giving each player a unique experience",
    mapPosition: { x: 15, y: 20 },
  },
  {
    id: "strategy", 
    power: "STRATEGY",
    powerJp: "戦略",
    icon: "🎯",
    description: "* turning simple rules into infinite possibilities",
    mapPosition: { x: 45, y: 15 },
  },
  {
    id: "nostalgia",
    power: "NOSTALGIA",
    powerJp: "郷愁",
    icon: "🕹️",
    description: "* pixels that hit different... you know?",
    mapPosition: { x: 75, y: 25 },
  },
  {
    id: "roleplay",
    power: "ROLEPLAY",
    powerJp: "役割",
    icon: "⭐",
    description: "* because numbers going up = serotonin",
    mapPosition: { x: 25, y: 60 },
  },
  {
    id: "paragame",
    power: "PARAGAME",
    powerJp: "超越",
    icon: "🌀",
    description: "* games about games... meta, right?",
    mapPosition: { x: 55, y: 70 },
  },
  {
    id: "modularity",
    power: "MODULARITY",
    powerJp: "模組",
    icon: "🧩",
    description: "* infinite combinations from finite pieces",
    mapPosition: { x: 80, y: 55 },
  },
];

// Expanded dialogues with MANY easter eggs
const dialogues = {
  intro: [
    "* oh hey. you actually clicked on something.",
    "* welcome to my corner of the internet.",
    "* i make games. or try to, anyway.",
    "* stick around if you want. no pressure.",
  ],
  // Easter egg dialogues for various elements
  nickname: [
    "* yep, that's my nickname.",
    "* primordial = ancient. rune = symbol. deep stuff, huh?",
    "* i came up with it when i was 14. still like it.",
    "* you can call me omar though. or just... hey you.",
  ],
  title: [
    "* that's what i do. design games.",
    "* sometimes they're even good. sometimes.",
    "* it's like architecture but more fun and less money.",
    "* the glitch effect? that's intentional. probably.",
  ],
  japaneseText: [
    "* ゲームデザイナー means 'game designer'. fancy, right?",
    "* i don't actually speak japanese fluently.",
    "* but the aesthetic is *chef's kiss*",
    "* blame jrpgs for my obsession with kanji.",
  ],
  cornerDecoration: [
    "* you found a corner. congratulations.",
    "* these are just for looks. no secrets here.",
    "* ...or are there?",
    "* (there aren't. i'm messing with you.)",
  ],
  logo: [
    "* that's my logo! designed it myself.",
    "* it's supposed to look like a rune. does it?",
    "* took me like 50 iterations to get it right.",
  ],
  discoverButton: [
    "* ooh, feeling adventurous?",
    "* that button shows random projects. try it!",
    "* it's like a loot box but free and ethical.",
  ],
  emptySpace: [
    "* you're clicking on empty space.",
    "* bold move. i respect that.",
    "* nothing here though. sorry.",
    "* ...unless?",
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
    "* try hovering on different things. there's secrets.",
  ],
  dialogueCollector: [
    "* oh, you noticed the counter!",
    "* it tracks unique dialogues you've found.",
    "* can you find them all? probably not. there's a lot.",
    "* ...i may have gone overboard with the easter eggs.",
  ],
  scanlines: [
    "* those are scanlines. retro crt effect.",
    "* makes everything feel more... authentic?",
    "* or maybe i just like the aesthetic. who knows.",
  ],
};

// Social links with enhanced descriptions
const socialLinks = [
  { id: "twitter", icon: "𝕏", url: "https://x.com/PrimordialRune", label: "Twitter/X", tagline: "hot takes" },
  { id: "telegram", icon: "✈", url: "https://t.me/PrimordialRune", label: "Telegram", tagline: "quick chat" },
  { id: "instagram", icon: "📷", url: "https://instagram.com/primordialrune", label: "Instagram", tagline: "rare posts" },
  { id: "github", icon: "⌨", url: "https://github.com/PrimordialRune", label: "GitHub", tagline: "the code" },
  { id: "email", icon: "✉", url: "mailto:primordialrune@gmail.com", label: "Email", tagline: "serious stuff" },
];

// All unique dialogue IDs for tracking
const allDialogueIds = [
  ...dialogues.intro.map((_, i) => `intro-${i}`),
  ...dialogues.nickname.map((_, i) => `nickname-${i}`),
  ...dialogues.title.map((_, i) => `title-${i}`),
  ...dialogues.japaneseText.map((_, i) => `japanese-${i}`),
  ...dialogues.cornerDecoration.map((_, i) => `corner-${i}`),
  ...dialogues.logo.map((_, i) => `logo-${i}`),
  ...dialogues.discoverButton.map((_, i) => `discover-${i}`),
  ...dialogues.emptySpace.map((_, i) => `empty-${i}`),
  ...Object.keys(dialogues.social).map(k => `social-${k}`),
  ...dialogues.idle.map((_, i) => `idle-${i}`),
  ...dialogues.dialogueCollector.map((_, i) => `collector-${i}`),
  ...dialogues.scanlines.map((_, i) => `scanlines-${i}`),
  ...superpowers.map(p => `power-${p.id}`),
];

export default function HeroSection({ isMobile = false, isLandscape = false }: HeroSectionProps) {
  const [currentDialogue, setCurrentDialogue] = useState(dialogues.intro[0]);
  const [currentDialogueId, setCurrentDialogueId] = useState("intro-0");
  const [showDialogue, setShowDialogue] = useState(true);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [discoveredPowers, setDiscoveredPowers] = useState<Set<string>>(new Set());
  const [discoveredDialogues, setDiscoveredDialogues] = useState<Set<string>>(new Set(["intro-0"]));
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState("GAME DESIGNER");
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  const dialogueIndexRef = useRef(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glitchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const randomGlitchRef = useRef<NodeJS.Timeout | null>(null);

  // Track dialogue discovery
  const showDialogueWithTracking = useCallback((text: string, id: string) => {
    setCurrentDialogue(text);
    setCurrentDialogueId(id);
    setShowDialogue(true);
    setDiscoveredDialogues(prev => new Set([...prev, id]));
  }, []);

  // Get random dialogue from category
  const getRandomDialogue = useCallback((category: string[], prefix: string) => {
    const index = Math.floor(Math.random() * category.length);
    return { text: category[index], id: `${prefix}-${index}` };
  }, []);

  // Glitch text effect - Enhanced Cyberpunk style distortion
  const triggerGlitch = useCallback((targetText: string, intense = false) => {
    setIsGlitching(true);
    const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?アイウエオカキクケコサシスセソタチツテト";
    let iterations = 0;
    const maxIterations = intense ? 15 : 10;
    const speed = intense ? 30 : 50;
    
    if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    
    glitchIntervalRef.current = setInterval(() => {
      setGlitchText(
        targetText
          .split("")
          .map((char, index) => {
            if (index < iterations) return targetText[index];
            if (char === " ") return " ";
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
    }, speed);
  }, []);

  // Random glitch effect on title
  useEffect(() => {
    const scheduleRandomGlitch = () => {
      const delay = 8000 + Math.random() * 12000; // 8-20 seconds
      randomGlitchRef.current = setTimeout(() => {
        if (!activePower && !hoveredElement) {
          triggerGlitch("GAME DESIGNER", true);
        }
        scheduleRandomGlitch();
      }, delay);
    };
    
    scheduleRandomGlitch();
    return () => {
      if (randomGlitchRef.current) clearTimeout(randomGlitchRef.current);
    };
  }, [activePower, hoveredElement, triggerGlitch]);

  // Handle power discovery
  const handlePowerHover = useCallback((powerId: string) => {
    setActivePower(powerId);
    setHoveredElement(`power-${powerId}`);
    setDiscoveredPowers(prev => new Set([...prev, powerId]));
    
    const power = superpowers.find(p => p.id === powerId);
    if (power) {
      showDialogueWithTracking(power.description, `power-${powerId}`);
      triggerGlitch(power.power, true);
    }
    
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, [triggerGlitch, showDialogueWithTracking]);

  const handlePowerLeave = useCallback(() => {
    setActivePower(null);
    setHoveredElement(null);
    triggerGlitch("GAME DESIGNER");
    
    idleTimerRef.current = setTimeout(() => {
      const { text, id } = getRandomDialogue(dialogues.idle, "idle");
      showDialogueWithTracking(text, id);
    }, 5000);
  }, [triggerGlitch, showDialogueWithTracking, getRandomDialogue]);

  // Handle social hover
  const handleSocialHover = useCallback((socialId: string) => {
    setHoveredSocial(socialId);
    setHoveredElement(`social-${socialId}`);
    const message = dialogues.social[socialId as keyof typeof dialogues.social];
    if (message) {
      showDialogueWithTracking(message, `social-${socialId}`);
    }
  }, [showDialogueWithTracking]);

  const handleSocialLeave = useCallback(() => {
    setHoveredSocial(null);
    setHoveredElement(null);
  }, []);

  // Easter egg hover handlers
  const handleElementHover = useCallback((elementType: string) => {
    setHoveredElement(elementType);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    let category: string[];
    let prefix: string;
    
    switch (elementType) {
      case "nickname":
        category = dialogues.nickname;
        prefix = "nickname";
        break;
      case "title":
        category = dialogues.title;
        prefix = "title";
        triggerGlitch("GAME DESIGNER", true);
        break;
      case "japanese":
        category = dialogues.japaneseText;
        prefix = "japanese";
        break;
      case "corner":
        category = dialogues.cornerDecoration;
        prefix = "corner";
        break;
      case "logo":
        category = dialogues.logo;
        prefix = "logo";
        break;
      case "discover":
        category = dialogues.discoverButton;
        prefix = "discover";
        break;
      case "counter":
        category = dialogues.dialogueCollector;
        prefix = "collector";
        break;
      case "scanlines":
        category = dialogues.scanlines;
        prefix = "scanlines";
        break;
      default:
        category = dialogues.emptySpace;
        prefix = "empty";
    }
    
    const { text, id } = getRandomDialogue(category, prefix);
    showDialogueWithTracking(text, id);
  }, [triggerGlitch, showDialogueWithTracking, getRandomDialogue]);

  const handleElementLeave = useCallback(() => {
    setHoveredElement(null);
  }, []);

  // Initial dialogue cycle
  useEffect(() => {
    const timer = setInterval(() => {
      if (!activePower && !hoveredSocial && !hoveredElement) {
        dialogueIndexRef.current = (dialogueIndexRef.current + 1) % dialogues.intro.length;
        showDialogueWithTracking(
          dialogues.intro[dialogueIndexRef.current],
          `intro-${dialogueIndexRef.current}`
        );
      }
    }, 8000);
    
    return () => {
      clearInterval(timer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    };
  }, [activePower, hoveredSocial, hoveredElement, showDialogueWithTracking]);

  // Discovery milestones
  const prevDiscoveredCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevDiscoveredCountRef.current;
    const currentCount = discoveredPowers.size;
    
    if (currentCount > prevCount && currentCount === superpowers.length) {
      const timer = setTimeout(() => {
        showDialogueWithTracking(
          "* wow, you found all the powers! you're thorough. i like that.",
          "milestone-all-powers"
        );
      }, 100);
      prevDiscoveredCountRef.current = currentCount;
      return () => clearTimeout(timer);
    }
    prevDiscoveredCountRef.current = currentCount;
  }, [discoveredPowers.size, showDialogueWithTracking]);

  const totalDialogues = allDialogueIds.length;
  const foundDialogues = discoveredDialogues.size;

  return (
    <div 
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={noInteractionStyles}
    >
      {/* Main content - Expanded layout for desktop */}
      <div className={`flex-1 flex ${isMobile && !isLandscape ? "flex-col" : "flex-row"} items-stretch p-4 md:p-6 lg:p-8 gap-4 md:gap-6`}>
        
        {/* Left column - Title and Speech Bubble */}
        <div className="flex flex-col justify-center flex-1 max-w-xl">
          {/* Title section */}
          <div 
            className="relative cursor-pointer"
            onMouseEnter={() => handleElementHover("title")}
            onMouseLeave={handleElementLeave}
          >
            {/* Japanese text with lightning effect */}
            <motion.div
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-cream/60 mb-2 cursor-pointer"
              style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
              onMouseEnter={() => handleElementHover("japanese")}
              onMouseLeave={handleElementLeave}
              animate={{
                textShadow: activePower || hoveredElement === "japanese" ? [
                  "0 0 10px rgba(250, 219, 104, 0.8)",
                  "0 0 20px rgba(250, 219, 104, 0.4)",
                  "0 0 30px rgba(78, 185, 159, 0.6)",
                  "0 0 10px rgba(250, 219, 104, 0.8)",
                ] : "0 0 0px transparent",
              }}
              transition={{ duration: 0.3, repeat: (activePower || hoveredElement === "japanese") ? Infinity : 0, repeatType: "reverse" }}
            >
              {activePower 
                ? superpowers.find(p => p.id === activePower)?.powerJp 
                : "ゲームデザイナー"}
            </motion.div>
            
            {/* Main glitching title - NOW CHANGES with power */}
            <motion.h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight ${
                isGlitching ? "text-blood-orange" : "text-aquamarine"
              }`}
              style={{ 
                fontFamily: "var(--font-fk-grotesk-black)",
                textShadow: isGlitching 
                  ? "3px 0 #ec563b, -3px 0 #4eb99f, 0 0 30px rgba(236, 86, 59, 0.6)"
                  : "0 4px 20px rgba(78, 185, 159, 0.3)",
              }}
              animate={{
                x: isGlitching ? [0, -5, 8, -3, 5, 0] : 0,
                skewX: isGlitching ? [0, 3, -3, 2, -1, 0] : 0,
                scaleY: isGlitching ? [1, 1.02, 0.98, 1.01, 1] : 1,
              }}
              transition={{ duration: 0.25 }}
            >
              {glitchText}
            </motion.h1>
            
            {/* Scanline overlay on text */}
            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-[0.08]"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 3px)",
                mixBlendMode: "overlay",
              }}
              onMouseEnter={() => handleElementHover("scanlines")}
            />
          </div>

          {/* Persona 5 style speech bubble with nametag - Arrow from title */}
          <div className="mt-6 relative">
            <AnimatePresence mode="wait">
              {showDialogue && (
                <SpeechBubble 
                  key={currentDialogueId}
                  text={currentDialogue}
                  speakerName="PrimordialRune"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Dialogue collector counter */}
          <motion.div 
            className="mt-4 flex items-center gap-2 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            onMouseEnter={() => handleElementHover("counter")}
            onMouseLeave={handleElementLeave}
          >
            <div className="text-cream/40 text-xs tracking-wider" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>
              [ DIALOGUES FOUND ]
            </div>
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 bg-peacock-blue/40 rounded"
              animate={{ 
                boxShadow: hoveredElement === "counter" 
                  ? "0 0 15px rgba(250, 219, 104, 0.4)" 
                  : "none" 
              }}
            >
              <span className="text-gold text-sm font-black" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>
                {foundDialogues}
              </span>
              <span className="text-cream/40 text-sm">/</span>
              <span className="text-cream/60 text-sm">{totalDialogues}</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Center - Superpower Minimap */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md">
          <motion.p 
            className="text-cream/40 text-xs mb-4 tracking-wider"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            [ DESIGN REALM ]
          </motion.p>
          
          {/* Minimap container */}
          <div className="relative w-full aspect-square max-w-[280px] md:max-w-[320px] lg:max-w-[360px]">
            {/* Map background */}
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(16, 47, 65, 0.6) 0%, rgba(16, 47, 65, 0.3) 100%)",
                border: "2px solid rgba(78, 185, 159, 0.3)",
                boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
            />
            
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--teal)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
            
            {/* Connection lines between discovered powers */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {superpowers.map((power, i) => 
                superpowers.slice(i + 1).map((otherPower) => {
                  const bothDiscovered = discoveredPowers.has(power.id) && discoveredPowers.has(otherPower.id);
                  return (
                    <motion.line
                      key={`line-${power.id}-${otherPower.id}`}
                      x1={`${power.mapPosition.x}%`}
                      y1={`${power.mapPosition.y}%`}
                      x2={`${otherPower.mapPosition.x}%`}
                      y2={`${otherPower.mapPosition.y}%`}
                      stroke={bothDiscovered ? "rgba(250, 219, 104, 0.4)" : "rgba(78, 185, 159, 0.15)"}
                      strokeWidth={bothDiscovered ? "2" : "1"}
                      strokeDasharray={bothDiscovered ? "none" : "4 4"}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: bothDiscovered ? 1 : 0.3 }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  );
                })
              )}
            </svg>
            
            {/* Power locations on map */}
            {superpowers.map((power, index) => (
              <MapPowerNode
                key={power.id}
                power={power}
                index={index}
                isActive={activePower === power.id}
                isDiscovered={discoveredPowers.has(power.id)}
                onHover={() => handlePowerHover(power.id)}
                onLeave={handlePowerLeave}
              />
            ))}
            
            {/* Center emblem */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-peacock-blue/60 flex items-center justify-center"
              style={{
                border: "2px solid var(--teal)",
                boxShadow: "0 0 20px rgba(78, 185, 159, 0.3)",
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(78, 185, 159, 0.3)",
                  "0 0 30px rgba(78, 185, 159, 0.5)",
                  "0 0 20px rgba(78, 185, 159, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-2xl">🎮</span>
            </motion.div>
          </div>
          
          {/* Discovery progress */}
          <motion.div 
            className="mt-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <span className="text-cream/40 text-xs" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>
              DISCOVERED:
            </span>
            <div className="flex gap-1">
              {superpowers.map((power) => (
                <motion.div
                  key={`progress-${power.id}`}
                  className={`w-3 h-3 rounded-sm ${
                    discoveredPowers.has(power.id) ? "bg-gold" : "bg-cream/20"
                  }`}
                  animate={{
                    scale: discoveredPowers.has(power.id) ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: discoveredPowers.has(power.id) 
                      ? "0 0 10px rgba(250, 219, 104, 0.8)" 
                      : "none",
                  }}
                  title={power.power}
                />
              ))}
            </div>
            <span className="text-gold text-xs font-black" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>
              {discoveredPowers.size}/{superpowers.length}
            </span>
          </motion.div>
        </div>

        {/* Right column - Social section with more character */}
        <div className="flex flex-col justify-center items-center gap-6 min-w-[180px]">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <p 
              className="text-cream/40 text-xs tracking-wider mb-1"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              [ TRANSMISSION CHANNELS ]
            </p>
            <p className="text-cream/30 text-[10px]">pick your frequency</p>
          </motion.div>
          
          <div className="flex flex-col gap-3">
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
          
          {/* Social taglines */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
          >
            <p className="text-cream/20 text-[10px] italic">
              all channels monitored by a human
            </p>
            <p className="text-cream/20 text-[10px] italic">
              (response time: eventually™)
            </p>
          </motion.div>
        </div>
      </div>

      {/* Interactive decorative corners */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { pos: "top-4 left-4", rotate: 0 },
          { pos: "top-4 right-4", rotate: 90 },
          { pos: "bottom-4 right-4", rotate: 180 },
          { pos: "bottom-4 left-4", rotate: 270 },
        ].map((corner, i) => (
          <motion.div
            key={`corner-${i}`}
            className={`absolute ${corner.pos} w-12 h-12 pointer-events-auto cursor-pointer`}
            style={{ transform: `rotate(${corner.rotate}deg)` }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.75 }}
            onMouseEnter={() => handleElementHover("corner")}
            onMouseLeave={handleElementLeave}
          >
            <div className="w-full h-1 bg-blood-orange/40" />
            <div className="w-1 h-full bg-blood-orange/40" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Persona 5 style speech bubble with nametag
interface SpeechBubbleProps {
  text: string;
  speakerName: string;
}

function SpeechBubble({ text, speakerName }: SpeechBubbleProps) {
  return (
    <motion.div
      className="relative"
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        y: 20,
        rotate: -2,
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
      {/* Nametag - Persona 5 style */}
      <motion.div
        className="absolute -top-6 left-0 flex items-center"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1, ...bubbleSpring }}
      >
        <div 
          className="px-3 py-1 bg-blood-orange text-cream text-xs font-black tracking-wider"
          style={{ 
            fontFamily: "var(--font-fk-grotesk-black)",
            clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
            boxShadow: "2px 2px 0 rgba(16, 47, 65, 0.5)",
          }}
        >
          {speakerName}
        </div>
        {/* Nametag connector */}
        <div 
          className="w-4 h-[2px] bg-blood-orange"
          style={{ marginLeft: -2 }}
        />
      </motion.div>

      {/* Main bubble */}
      <div 
        className="relative bg-cream px-5 py-4 md:px-6 md:py-5 max-w-md"
        style={{
          clipPath: "polygon(0 8%, 2% 0, 98% 0, 100% 8%, 100% 92%, 98% 100%, 2% 100%, 0 92%)",
          boxShadow: `
            5px 5px 0 var(--blood-orange),
            10px 10px 0 rgba(16, 47, 65, 0.3)
          `,
        }}
      >
        {/* Inner border effect */}
        <div 
          className="absolute inset-[4px] border-2 border-blood-orange/20 pointer-events-none"
          style={{
            clipPath: "polygon(0 8%, 2% 0, 98% 0, 100% 8%, 100% 92%, 98% 100%, 2% 100%, 0 92%)",
          }}
        />
        
        {/* Text */}
        <motion.p
          className="relative text-peacock-blue text-sm md:text-base font-bold leading-relaxed"
          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {text}
        </motion.p>
        
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
          style={{ boxShadow: "0 0 12px rgba(250, 219, 104, 0.8)" }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-blood-orange rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 500 }}
        />
        
        {/* Bubble terminator - Persona 5 style angular end */}
        <motion.div
          className="absolute -right-2 top-1/2 -translate-y-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <div 
            className="w-0 h-0"
            style={{
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "10px solid var(--cream)",
              filter: "drop-shadow(3px 0 0 var(--blood-orange))",
            }}
          />
        </motion.div>
      </div>
      
      {/* Tail pointing UP to title */}
      <motion.div
        className="absolute -top-2 left-12 w-0 h-0"
        style={{
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderBottom: "14px solid var(--cream)",
          filter: "drop-shadow(0 -2px 0 var(--blood-orange))",
        }}
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1, ...bubbleSpring }}
      />
    </motion.div>
  );
}

// Map power node - location on minimap
interface MapPowerNodeProps {
  power: typeof superpowers[0];
  index: number;
  isActive: boolean;
  isDiscovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MapPowerNode({ power, index, isActive, isDiscovered, onHover, onLeave }: MapPowerNodeProps) {
  return (
    <motion.button
      className="absolute flex flex-col items-center"
      style={{
        left: `${power.mapPosition.x}%`,
        top: `${power.mapPosition.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.15, ...persona5Spring }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Node circle */}
      <motion.div
        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg
          ${isActive 
            ? "bg-blood-orange" 
            : isDiscovered 
              ? "bg-teal/80" 
              : "bg-peacock-blue/50"
          }
        `}
        style={{
          border: isActive 
            ? "3px solid var(--gold)" 
            : isDiscovered 
              ? "2px solid var(--aquamarine)" 
              : "2px solid rgba(78, 185, 159, 0.3)",
          boxShadow: isActive 
            ? "0 0 25px rgba(236, 86, 59, 0.7), 0 0 50px rgba(236, 86, 59, 0.4)"
            : isDiscovered
              ? "0 0 15px rgba(78, 185, 159, 0.4)"
              : "0 0 8px rgba(0, 0, 0, 0.3)",
        }}
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
      >
        <span className="relative z-10">{power.icon}</span>
        
        {/* Pulse ring when active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        
        {/* Discovery sparkle */}
        {isDiscovered && !isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: "0 0 8px rgba(250, 219, 104, 1)" }}
          />
        )}
        
        {/* Undiscovered pulse */}
        {!isDiscovered && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(250, 219, 104, 0.4), transparent 60%)",
            }}
          />
        )}
      </motion.div>
      
      {/* Label */}
      <motion.div
        className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider whitespace-nowrap
          ${isActive 
            ? "bg-blood-orange text-cream" 
            : isDiscovered 
              ? "bg-teal/60 text-cream" 
              : "bg-peacock-blue/40 text-cream/50"
          }
        `}
        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
        animate={{ opacity: isActive || isDiscovered ? 1 : 0.6 }}
      >
        {isDiscovered ? power.power : "???"}
      </motion.div>
    </motion.button>
  );
}

// Enhanced social button component
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
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg group
        ${isHovered 
          ? "bg-blood-orange" 
          : "bg-peacock-blue/40 hover:bg-peacock-blue/60"
        }
      `}
      style={{
        boxShadow: isHovered 
          ? "0 4px 20px rgba(236, 86, 59, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)"
          : "inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.2)",
        minWidth: "160px",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      initial={{ opacity: 0, x: 20 }}
      animate={{ 
        opacity: 1, 
        x: isHovered ? -4 : 0,
      }}
      transition={{
        ...persona5Spring,
        delay: 2.5 + index * 0.1,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon */}
      <span className={`text-xl ${isHovered ? "text-cream" : "text-cream/70"}`}>
        {social.icon}
      </span>
      
      {/* Label and tagline */}
      <div className="flex flex-col">
        <span 
          className={`text-sm font-black ${isHovered ? "text-cream" : "text-cream/80"}`}
          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
        >
          {social.label}
        </span>
        <span 
          className={`text-[10px] ${isHovered ? "text-cream/80" : "text-cream/40"}`}
        >
          {social.tagline}
        </span>
      </div>
      
      {/* Arrow indicator */}
      <motion.span 
        className={`ml-auto text-sm ${isHovered ? "text-cream" : "text-cream/40"}`}
        animate={{ x: isHovered ? 4 : 0 }}
      >
        →
      </motion.span>
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </motion.a>
  );
}
