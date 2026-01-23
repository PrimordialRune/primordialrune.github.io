"use client";

import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ProjectGrid from "@/components/ProjectGrid";
import FloatingProjects from "@/components/FloatingProjects";
import ProjectModal from "@/components/ProjectModal";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { getProjectsByCategory, getFeaturedProjects, getAllProjects } from "@/lib/projects";

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

// Enhanced Discover Button Component with cool animation
function DiscoverButton({ onDiscover }: { onDiscover: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    // Trigger the animation sequence then call onDiscover
    setTimeout(() => {
      onDiscover();
      setIsAnimating(false);
    }, 600);
  };

  return (
    <motion.button
      className="relative px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-black text-xs md:text-sm overflow-hidden"
      style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`scanline-${i}`}
                className="absolute left-0 right-0 h-[2px] bg-cream/60"
                style={{ top: `${20 + i * 15}%` }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ 
                  scaleX: [0, 1, 1, 0],
                  originX: [0, 0, 1, 1]
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.05,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle particles on hover */}
      <AnimatePresence>
        {isHovered && !isAnimating && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-1 h-1 bg-gold rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: "50%",
                }}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [-10, -20, -30],
                }}
                transition={{ 
                  duration: 0.8,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
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

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("hero");
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
    setSelectedProject(project);
  };

  const closeModal = () => {
    setSelectedProject(null);
  };

  // Discover feature: show a random project
  const handleDiscover = useCallback(() => {
    if (allProjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * allProjects.length);
      const randomProject = allProjects[randomIndex];
      setSelectedProject(randomProject);
    }
  }, [allProjects]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
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

        {/* Secondary Nav - Only Discover button now */}
        <div className="hidden sm:flex gap-2 md:gap-3">
          <DiscoverButton onDiscover={handleDiscover} />
        </div>
      </header>

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
                className="absolute inset-0 opacity-[0.08]"
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
                  {/* Hero Section - TBD */}
                  {activeCategory === "hero" && (
                    <div className="flex flex-col items-center justify-center h-full px-4">
                      <h1
                        className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-black text-cream mb-4 md:mb-6 leading-none text-center"
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
                          className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-aquamarine tracking-[0.2em] md:tracking-[0.3em]"
                          style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                        >
                          DESIGN
                        </p>
                      </div>
                    </div>
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
              className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-10 text-aquamarine/40 text-sm md:text-lg tracking-wider z-20"
              style={{ fontFamily: "var(--font-8bit-darling)" }}
            >
              原初のルーン
            </div>
          </div>
        </div>
      </main>

      {/* Bottom NES Stripe */}
      <div className="fixed bottom-0 left-0 right-0 h-[var(--stripe-height)] bg-blood-orange z-50" />

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={closeModal} />
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
