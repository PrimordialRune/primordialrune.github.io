"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ProjectGrid from "@/components/ProjectGrid";
import FloatingProjects from "@/components/FloatingProjects";
import ProjectModal from "@/components/ProjectModal";
import HeroSection from "@/components/HeroSection";
import { AstroidSparkle } from "@/components/AstroidSparkle";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { getProjectsByCategory, getFeaturedProjects, getAllProjects } from "@/lib/projects";
import { seededRandom } from "@/lib/utils";


// Custom hook for responsive detection
function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 1024);
      setIsLandscape(width > height);
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    return () => window.removeEventListener("resize", checkResponsive);
  }, []);

  return { isMobile, isLandscape };
}

// Enhanced Discover Button Component with 3D tilt and magical effects
function DiscoverButton({ onDiscover, onAnimationStart }: { onDiscover: () => void; onAnimationStart?: () => void }) {
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

// CRT Noise/Zapping Effect Overlay
function CRTNoiseOverlay({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[200] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Static noise pattern */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              opacity: 0.15,
              mixBlendMode: "overlay",
            }}
            animate={{
              opacity: [0.15, 0.25, 0.1, 0.2, 0.15],
              scale: [1, 1.02, 0.98, 1.01, 1],
            }}
            transition={{
              duration: 0.5,
              times: [0, 0.2, 0.4, 0.7, 1],
            }}
          />
          
          {/* Horizontal scan lines distortion */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236, 86, 59, 0.1) 2px, rgba(236, 86, 59, 0.1) 4px)",
            }}
            animate={{
              y: [0, 10, -5, 8, 0],
              opacity: [0.3, 0.6, 0.2, 0.5, 0],
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.2, 0.5, 0.8, 1],
            }}
          />

          {/* Color aberration flashes */}
          <motion.div
            className="absolute inset-0 bg-blood-orange/20"
            animate={{
              opacity: [0, 0.3, 0, 0.2, 0],
            }}
            transition={{
              duration: 0.5,
              times: [0, 0.15, 0.3, 0.6, 1],
            }}
          />

          {/* Vertical glitch bands */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`glitch-${i}`}
              className="absolute top-0 bottom-0 bg-cream/10"
              style={{
                left: `${15 + i * 18}%`,
                width: `${2 + seededRandom(i * 137.5) * 3}%`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: [0, 0.5, 0],
                scaleY: [0, 1, 0],
                x: [0, (seededRandom(i * 247.1) - 0.5) * 20, 0],
              }}
              transition={{
                duration: 0.4,
                delay: i * 0.05,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("hero");
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDiscoverMode, setIsDiscoverMode] = useState(false);
  const [showCRTNoise, setShowCRTNoise] = useState(false);
  const { isMobile, isLandscape } = useResponsive();
  // Load all projects on mount for discover feature
  useEffect(() => {
    async function loadAllProjects() {
      const all = await getAllProjects();
      setAllProjects(all);
    }
    loadAllProjects();
  }, []);

  // Load projects when category changes
  useEffect(() => {
    async function loadProjects() {
      let projectsToShow: Project[] = [];

      if (activeCategory === "hero") {
        // For hero section, show featured projects
        projectsToShow = await getFeaturedProjects();
      } else {
        // For other categories, show projects by category
        projectsToShow = await getProjectsByCategory(activeCategory);
      }

      setProjects(projectsToShow);
    }

    loadProjects();
  }, [activeCategory]);

  const handleProjectClick = (project: Project) => {
    setIsDiscoverMode(false);
    setSelectedProject(project);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsDiscoverMode(false);
  };

  // Discover feature: show a random project with CRT effect
  const handleDiscoverAnimationStart = useCallback(() => {
    setShowCRTNoise(true);
    window.dispatchEvent(new CustomEvent("primordialrune:discover-triggered"));
    setTimeout(() => setShowCRTNoise(false), 400);
  }, []);

  const handleDiscover = useCallback(() => {
    if (allProjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * allProjects.length);
      const randomProject = allProjects[randomIndex];
      setIsDiscoverMode(true);
      setSelectedProject(randomProject);
    }
  }, [allProjects]);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 54%, rgba(80, 190, 160, 0.08) 0%, rgba(200, 170, 100, 0.03) 38%, var(--cream) 65%)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top NES Stripe */}
      <div className="fixed top-0 left-0 right-0 h-[var(--stripe-height)] bg-blood-orange z-50" />

      {/* Header */}
      <header className="fixed top-[var(--stripe-height)] left-0 right-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 md:py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <svg
              viewBox="0 0 554.72 555"
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 cursor-pointer transition-opacity hover:opacity-75 active:opacity-50"
              onClick={() => window.dispatchEvent(new CustomEvent("primordialrune:logo-clicked"))}
              aria-label="Logo easter egg"
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
            <div className="flex items-center gap-1 md:gap-2">
              <span
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-blood-orange italic leading-none cursor-pointer transition-opacity hover:opacity-75 active:opacity-50 select-none"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                onClick={() => window.dispatchEvent(new CustomEvent("primordialrune:nickname-clicked"))}
              >
                PRIMORDIAL
              </span>
              <span
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-peacock-blue italic leading-none cursor-pointer transition-opacity hover:opacity-75 active:opacity-50 select-none"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                onClick={() => window.dispatchEvent(new CustomEvent("primordialrune:nickname-clicked"))}
              >
                RUNE
              </span>
            </div>
          </div>

          {/* Section breadcrumb — hidden on small screens */}
          <div className="hidden md:flex items-center gap-0" aria-hidden="true">
            {[
              { id: "hero", n: "01", label: "HERO" },
              { id: "systems", n: "02", label: "SYSTEMS" },
              { id: "worlds", n: "03", label: "WORLDS" },
              { id: "interfaces", n: "04", label: "INTERFACES" },
              { id: "archives", n: "05", label: "ARCHIVES" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center">
                {i > 0 && (
                  <span className="mx-1.5 text-peacock-blue/25 text-[10px] font-black select-none">›</span>
                )}
                <span
                  className={`text-[10px] lg:text-xs font-black tracking-widest transition-colors duration-300 select-none ${
                    activeCategory === s.id
                      ? "text-blood-orange"
                      : "text-peacock-blue/30"
                  }`}
                  style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Secondary Nav - Discover button */}
          <div className="flex gap-2 md:gap-3">
            <DiscoverButton onDiscover={handleDiscover} onAnimationStart={handleDiscoverAnimationStart} />
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-px w-full" style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(236,86,59,0.18) 15%, rgba(16,47,65,0.35) 40%, rgba(16,47,65,0.35) 60%, rgba(236,86,59,0.18) 85%, transparent 100%)"
        }} />
      </header>

      {/* CRT Noise Effect Overlay */}
      <CRTNoiseOverlay isActive={showCRTNoise} />

      {/* Main Content Area (CRT Panel) */}
      <main className="fixed inset-0 pt-12 sm:pt-14 md:pt-[4.5rem] pb-4 sm:pb-6 md:pb-8 px-2 sm:px-4 md:px-6 flex justify-center items-center">
        <div className="relative w-full h-full">
          {/* ── CRT TV Housing (Bezel) ─────────────────────────────
              Outer plastic body of the monitor. Inset padding creates
              the visible frame — thicker on desktop, tighter on mobile.
              Bevel gradient simulates overhead ambient lighting.       ──── */}
          <div
            className="absolute inset-0"
            style={{
              padding: "clamp(14px, 2vw, 28px)",
              borderRadius: "clamp(34px, 5vw, 58px)",
              /* Warm gray — cream desaturated and darkened, reads as the same plastic family */
              background: `linear-gradient(
                148deg,
                #c0b09a 0%,
                #8c7e6a 10%,
                #504840 50%,
                #3c3430 82%,
                #484038 100%
              )`,
              boxShadow: `
                0 8px 28px rgba(0, 0, 0, 0.65),
                0 2px 8px rgba(0, 0, 0, 0.45),
                inset 0 3px 0 rgba(255, 255, 255, 0.18),
                inset 0 -2px 0 rgba(0, 0, 0, 0.6),
                inset 3px 0 0 rgba(255, 255, 255, 0.09),
                inset -1px 0 0 rgba(0, 0, 0, 0.3),
                inset 0 0 clamp(14px, 2.5vw, 28px) clamp(8px, 1.5vw, 16px) rgba(0,0,0,0.80),
                0 0 18px rgba(78, 185, 159, 0.1),
                0 0 50px rgba(78, 185, 159, 0.04)
              `,
            }}
          >
            {/* ── Chamfer Ring — the visible plastic-to-glass transition ──
                Sits between the bezel padding and the screen surface.
                Inset highlights/shadows simulate the lit/shadow faces of
                the beveled plastic rim that frames the screen glass.    ──── */}
            <div
              className="relative w-full h-full"
              style={{
                borderRadius: "clamp(24px, 3.4vw, 36px)",
                /* Inner ledge — same warm-gray family, slightly darker than outer bezel */
                background: `linear-gradient(148deg, #8c7e6a 0%, #504840 50%, #30281e 100%)`,
                boxShadow: `
                  inset 0 3px 0 rgba(255,255,255,0.16),
                  inset 3px 0 0 rgba(255,255,255,0.08),
                  inset 0 -3px 0 rgba(0,0,0,0.75),
                  inset -3px 0 0 rgba(0,0,0,0.60),
                  inset 0 0 0 5px rgba(0,0,0,0.92)
                `,
                padding: "5px",
              }}
            >

            {/* ── CRT Screen Surface (recessed into bezel) ──────────
                border-radius = chamfer_r − 3px padding                 ──── */}
            <div
              className="relative w-full h-full overflow-hidden"
              style={{
                /* screen_r ≈ chamfer_r − 5px: (24−5)=19 .. (36−5)=31 */
                borderRadius: "clamp(19px, 2.9vw, 31px)",
                /* Lighter teal — playful, not gloomy; center glows warm teal */
                background: `radial-gradient(ellipse at 50% 44%,
                  #237a80 0%,
                  #165e65 15%,
                  #0e4450 35%,
                  #07262e 62%,
                  #030e11 100%)`,
                /* Deep incavation with teal-tinted shadows — looks recessed, not just dark */
                boxShadow: `
                  inset 0 0 0 2px rgba(5, 18, 28, 0.98),
                  inset 0 0 0 14px rgba(10, 30, 48, 0.72),
                  inset 22px 26px 60px rgba(5, 15, 25, 0.82),
                  inset -10px -14px 36px rgba(10, 30, 48, 0.45),
                  inset 10px 0 36px rgba(5, 18, 30, 0.72),
                  inset -10px 0 36px rgba(5, 18, 30, 0.72),
                  0 0 0 1px rgba(255, 255, 255, 0.03)
                `,
              }}
            >
            {/* ── Phosphor Glow Stack ───────────────────────────────
                Three layered gradients replace the old single bloom.
                Layer ordering matters: warm amber sits above cool teal.  ──── */}

            {/* Layer 1 — Primary phosphor emission (teal, center bloom) */}
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                background: `
                  radial-gradient(ellipse at 50% 46%,
                    rgba(78, 185, 159, 0.20) 0%,
                    rgba(51, 153, 153, 0.10) 26%,
                    rgba(51, 153, 153, 0.03) 50%,
                    transparent 65%)
                `,
                animation: "phosphorBreath 7s ease-in-out infinite",
              }}
            />

            {/* Layer 2 — Warm amber hotspot (upper-center, phosphor temperature) */}
            <div
              className="absolute inset-0 pointer-events-none z-[2]"
              style={{
                background: `
                  radial-gradient(ellipse at 50% 38%,
                    rgba(250, 219, 104, 0.07) 0%,
                    rgba(200, 155, 80, 0.03) 28%,
                    transparent 48%)
                `,
                animation: "phosphorBreath 7s ease-in-out infinite 1.2s",
              }}
            />

            {/* Layer 3 — Convex glass center highlight (simulates curved glass closest to viewer) */}
            <div
              className="absolute inset-0 pointer-events-none z-[3]"
              style={{
                background: `radial-gradient(ellipse at 50% 44%,
                  rgba(255, 255, 255, 0.055) 0%,
                  rgba(255, 255, 255, 0.018) 22%,
                  transparent 40%)`,
              }}
            />

            {/* Film grain / phosphor noise */}
            <div
              className="absolute inset-0 pointer-events-none z-[4]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "180px 180px",
                opacity: 0.045,
                animation: "crtGrain 0.6s steps(1) infinite",
                willChange: "background-position",
              }}
            />

            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(51, 153, 153, 0.2) 3px, rgba(51, 153, 153, 0.2) 4px)",
                  animation: "scanlines 16s linear infinite",
                }}
              />
            </div>

            {/* Vignette — elliptical edge + aggressive corner darkening.
                Corner radials make center-of-edge appear lighter (thinner
                bezel feel) vs corners (heavy shadow = CRT glass curvature). */}
            <div
              className="absolute inset-0 pointer-events-none z-[21]"
              style={{
                /* Peacock-blue vignette — strong corners for curved-glass depth, no pure black */
                background: `
                  radial-gradient(ellipse at 50% 50%, transparent 44%, rgba(16,47,65,0.28) 66%, rgba(16,47,65,0.62) 100%),
                  radial-gradient(circle at 0% 0%,    rgba(16,47,65,0.62) 0%, transparent 46%),
                  radial-gradient(circle at 100% 0%,  rgba(16,47,65,0.62) 0%, transparent 46%),
                  radial-gradient(circle at 0% 100%,  rgba(16,47,65,0.52) 0%, transparent 46%),
                  radial-gradient(circle at 100% 100%,rgba(16,47,65,0.52) 0%, transparent 46%)
                `,
              }}
            />

            {/* Screen glare — glass surface highlight (top-left) */}
            <div
              className="absolute inset-0 pointer-events-none z-[22]"
              style={{
                background: "radial-gradient(ellipse at 26% 20%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 28%, transparent 48%)",
              }}
            />

            {/* Rare flicker — occasional CRT discharge */}
            <div
              className="absolute inset-0 pointer-events-none z-[23]"
              style={{
                background: "rgba(0, 0, 0, 0.18)",
                animation: "crtFlicker 8s ease-in-out infinite",
                opacity: 0,
              }}
            />

            {/* Navigation - Now inside CRT panel for proper containment */}
            <Navigation 
              onOpenChange={setNavOpen} 
              onCategoryChange={setActiveCategory}
              isMobile={isMobile}
              isLandscape={isLandscape}
            />

            {/* Content - Shifts when nav is open on desktop, no shift on mobile (overlay) */}
            <motion.div
              className="relative z-10 w-full h-full"
              animate={{
                // nav width + its left inset (lg:left-6 = 1.5rem) + breathing room (1rem)
                paddingLeft: !isMobile && navOpen
                  ? "calc(var(--nav-open-width) + 2.5rem)"
                  : "clamp(1rem, 3vw, 3rem)",
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 350,
                mass: 0.6,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  {/* Hero Section - Interactive keyword carousel */}
                  {activeCategory === "hero" && (
                    <HeroSection
                      isMobile={isMobile}
                      isLandscape={isLandscape}
                    />
                  )}

                  {/* Archives Section - Grid View */}
                  {activeCategory === "archives" && (
                    <ProjectGrid
                      projects={projects}
                      onProjectClick={handleProjectClick}
                    />
                  )}

                  {/* Systems, Worlds, Interfaces - Floating View */}
                  {(activeCategory === "systems" ||
                    activeCategory === "worlds" ||
                    activeCategory === "interfaces") && (
                    <FloatingProjects
                      projects={projects}
                      onProjectClick={handleProjectClick}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Footer Signature */}
            <div
              className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-10 text-aquamarine/55 text-sm md:text-lg tracking-wider z-20"
              style={{
                fontFamily: "var(--font-gen-ei-kiwami)",
                textShadow: "0 0 10px rgba(78, 185, 159, 0.45), 0 0 22px rgba(78, 185, 159, 0.18)",
              }}
            >
              原初のルーン
            </div>
            </div> {/* /screen */}
            </div> {/* /chamfer ring */}
          </div> {/* /bezel */}
        </div>
      </main>

      {/* Bottom NES Stripe */}
      <div className="fixed bottom-0 left-0 right-0 h-[var(--stripe-height)] bg-blood-orange z-50" />

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal key={selectedProject.slug} project={selectedProject} onClose={closeModal} isDiscoverMode={isDiscoverMode} />
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes scanlines {
          0%   { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        @keyframes crtFlicker {
          0%, 86%, 89.5%, 93%, 100% { opacity: 0; }
          87%  { opacity: 1; }
          88%  { opacity: 0.4; }
          90%  { opacity: 1; }
          91%  { opacity: 0; }
          93.5% { opacity: 0.7; }
          94%  { opacity: 0; }
        }

        @keyframes phosphorBreath {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.72; }
        }

        @keyframes crtGrain {
          0%   { background-position:   0%   0%; }
          14%  { background-position: -14% -18%; }
          28%  { background-position:  22%   8%; }
          42%  { background-position:  -8%  24%; }
          57%  { background-position:  16% -14%; }
          71%  { background-position: -22%  12%; }
          85%  { background-position:   8% -22%; }
          100% { background-position:   0%   0%; }
        }
      `}</style>
    </div>
  );
}
