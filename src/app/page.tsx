"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ProjectGrid from "@/components/ProjectGrid";
import FloatingProjects from "@/components/FloatingProjects";
import ProjectModal from "@/components/ProjectModal";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { getProjectsByCategory, getFeaturedProjects } from "@/lib/projects";

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

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("hero");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { isMobile, isLandscape } = useResponsive();

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

        {/* Secondary Nav */}
        <div className="hidden sm:flex gap-2 md:gap-3">
          <button
            className="px-3 md:px-5 py-1.5 md:py-2 border-2 border-blood-orange text-blood-orange rounded-lg font-black text-xs md:text-sm hover:bg-blood-orange hover:text-cream transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            DISCOVER
          </button>
          <button
            className="px-3 md:px-5 py-1.5 md:py-2 border-2 border-blood-orange text-blood-orange rounded-lg font-black text-xs md:text-sm hover:bg-blood-orange hover:text-cream transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            ABOUT ME
          </button>
        </div>
      </header>

      {/* Navigation - Pass responsive state */}
      <Navigation 
        onOpenChange={setNavOpen} 
        onCategoryChange={setActiveCategory}
        isMobile={isMobile}
        isLandscape={isLandscape}
      />

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

            {/* Content - Shifts when nav is open on desktop, no shift on mobile (overlay) */}
            <motion.div
              className="relative z-10 w-full h-full"
              animate={{
                paddingLeft: !isMobile && navOpen ? "min(420px, 30vw)" : "clamp(1rem, 3vw, 3rem)",
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
