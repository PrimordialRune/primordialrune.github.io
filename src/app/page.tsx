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
import { useTheme } from "@/lib/ThemeContext";

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
    }, 800);
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
  const { theme, toggleTheme, themeLabel } = useTheme();

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
    setTimeout(() => setShowCRTNoise(false), 600);
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
    <div className="relative min-h-screen bg-background overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {/* Top NES Stripe */}
      <div className="fixed top-0 left-0 right-0 h-[var(--stripe-height)] bg-blood-orange z-50" />

      {/* Header */}
      <header className="fixed top-[var(--stripe-height)] left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 md:py-3 bg-background/95 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <svg
            viewBox="0 0 554.72 555"
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
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
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-blood-orange italic leading-none"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              PRIMORDIAL
            </span>
            <span
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-peacock-blue italic leading-none"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              RUNE
            </span>
          </div>
        </div>

        {/* Secondary Nav - Discover button visible on all screen sizes */}
        <div className="flex gap-2 md:gap-3">
          <DiscoverButton onDiscover={handleDiscover} onAnimationStart={handleDiscoverAnimationStart} />
        </div>
      </header>

      {/* CRT Noise Effect Overlay */}
      <CRTNoiseOverlay isActive={showCRTNoise} />

      {/* Main Content Area (CRT Panel) */}
      <main className="fixed inset-0 pt-14 sm:pt-16 md:pt-[5rem] pb-4 sm:pb-6 md:pb-8 px-2 sm:px-4 md:px-6 flex justify-center items-center">
        <div className="relative w-full h-full">
          {/* CRT Display Panel with Embossing */}
          <div
            className="relative w-full h-full bg-panel-bg rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden"
            style={{
              boxShadow: `
                inset 4px 4px 8px rgba(0, 0, 0, 0.2),
                inset -4px -4px 8px rgba(255, 255, 255, 0.03),
                0 0 0 4px transparent,
                0 0 0 6px rgba(0, 0, 0, 0.2),
                0 0 0 10px rgba(0, 0, 0, 0.1),
                0 8px 24px rgba(0, 0, 0, 0.3)
              `,
            }}
          >
            {/* Scanline Effect Overlay - Animated */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div
                className="absolute inset-0 opacity-[0.08] scanline-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                  animation: "scanlines 16s linear infinite, crtFlicker 4s ease-in-out infinite",
                }}
              />
            </div>

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
                paddingLeft: !isMobile && navOpen ? "min(360px, 26vw)" : "clamp(1rem, 3vw, 3rem)",
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 250,
                mass: 0.8,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
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
                      navOpen={navOpen}
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

            {/* Footer Signature — Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-10 z-20 flex flex-col items-end gap-1 cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${theme === "industrial" ? "Retro Wave" : "Industrial"} theme`}
              aria-label={`Current theme: ${themeLabel}. Click to switch.`}
            >
              <motion.span
                className="text-aquamarine/40 text-sm md:text-lg tracking-wider group-hover:text-aquamarine/80 transition-colors"
                style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
              >
                原初のルーン
              </motion.span>
              <motion.span
                key={themeLabel}
                className="text-[9px] md:text-[11px] tracking-[0.3em] text-aquamarine/30 group-hover:text-aquamarine/70 transition-colors"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {themeLabel}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </main>

      {/* Bottom NES Stripe */}
      <div className="fixed bottom-0 left-0 right-0 h-[var(--stripe-height)] bg-blood-orange z-50" />

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={closeModal} isDiscoverMode={isDiscoverMode} />
      )}

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

        @keyframes crtFlicker {
          0%,
          100% {
            opacity: 0.08;
          }
          50% {
            opacity: 0.06;
          }
        }
      `}</style>
    </div>
  );
}
