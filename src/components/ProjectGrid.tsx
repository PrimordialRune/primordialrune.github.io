"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { useState, useMemo } from "react";

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  navOpen?: boolean;
}

const ITEMS_PER_PAGE = 6;

// Height that matches the hamburger menu height (for collision prevention)
const TITLE_SECTION_HEIGHT = "clamp(120px, 6vh, 60px)";

export default function ProjectGrid({
  projects,
  onProjectClick,
  navOpen = false,
}: ProjectGridProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const needsPagination = projects.length > ITEMS_PER_PAGE;

  const currentProjects = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return projects.slice(start, start + ITEMS_PER_PAGE);
  }, [projects, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(totalPages - 1, page)));
  };

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p
            className="text-4xl sm:text-5xl md:text-6xl font-black text-aquamarine/30 mb-4"
            style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
          >
            準備中
          </p>
          <p className="text-base sm:text-lg md:text-xl text-cream/60">
            Projects coming soon...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full h-full flex flex-col relative overflow-hidden"
      animate={{
        paddingLeft: navOpen ? "clamp(3rem, 5vw, 4rem)" : "clamp(1rem, 2vw, 2rem)",
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 250,
        mass: 0.8,
      }}
    >
      {/* Background decorative elements - matching HeroSection */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="archiveGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--teal)" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#archiveGrid)" />
        </svg>
        
        {/* Floating particles - spread across screen */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`archive-particle-${i}`}
            className={`absolute rounded-full ${i % 3 === 0 ? "bg-aquamarine/20" : i % 3 === 1 ? "bg-blood-orange/15" : "bg-gold/15"}`}
            style={{
              width: 2 + (i % 3) * 2,
              height: 2 + (i % 3) * 2,
              left: `${8 + (i * 7.5)}%`,
              top: `${15 + ((i * 17) % 65)}%`,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, (i % 2 === 0 ? 6 : -6), 0],
              opacity: [0.12, 0.35, 0.12],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6 + (i % 4),
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Ambient glow orb */}
        <motion.div
          className="absolute w-28 h-28 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(78, 185, 159, 0.05) 0%, transparent 70%)",
            top: "20%",
            right: "10%",
          }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 9, repeat: Infinity }}
        />
      </div>
      
      {/* Archive Title Section - matches hamburger menu height to prevent overlap */}
      <div
        className="flex-shrink-0 flex items-center px-2 sm:px-4 pt-4 sm:pt-6 relative z-10"
        style={{
          minHeight: TITLE_SECTION_HEIGHT,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span 
            className="text-lg sm:text-xl md:text-2xl font-black text-aquamarine"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            ARCHIVES
          </span>
          <span 
            className="text-xs sm:text-sm text-aquamarine/60 tracking-wider"
            style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
          >
            アーカイブ
          </span>
        </div>
      </div>
      
      {/* Scrollable grid area */}
      <div className="flex-1 overflow-y-auto pr-4 sm:pr-8 md:pr-12 px-3 py-4 sm:py-4 md:py-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                },
              },
              exit: { opacity: 0 },
            }}
          >
            {currentProjects.map((project) => (
              <motion.button
                key={project.slug}
                onClick={() => onProjectClick(project)}
                className="project-card group relative bg-dark-teal/40 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden border-2 border-teal/30 hover:border-aquamarine transition-all"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 0 24px rgba(78, 185, 159, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-peacock-blue/60 overflow-hidden">
                  {project.thumbnail && (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Scanline overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                    }}
                  />

                  {/* Year badge */}
                  <div
                    className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-blood-orange/90 backdrop-blur-sm rounded-md sm:rounded-lg text-cream text-xs sm:text-sm font-black"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {project.year}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-5 text-left">
                  {/* Title */}
                  <h3
                    className="text-base sm:text-lg md:text-xl font-black text-cream mb-1 group-hover:text-aquamarine transition-colors"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {project.title}
                  </h3>

                  {/* Japanese Title */}
                  {project.titleJp && (
                    <p
                      className="text-[10px] sm:text-xs text-aquamarine/60 mb-2 sm:mb-3 tracking-wider"
                      style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
                    >
                      {project.titleJp}
                    </p>
                  )}

                  {/* Short Description */}
                  <p className="text-xs sm:text-sm text-cream/70 mb-2 sm:mb-4 line-clamp-2">
                    {project.shortDescription}
                  </p>

                  {/* Role */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <span className="text-[10px] sm:text-xs text-aquamarine/80 font-black">
                      ROLE:
                    </span>
                    <span className="text-[10px] sm:text-xs text-cream/60">{project.role}</span>
                  </div>

                  {/* Tools */}
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {project.tools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-peacock-blue/60 rounded text-[10px] sm:text-xs text-aquamarine/80 font-black"
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {tool}
                      </span>
                    ))}
                    {project.tools.length > 3 && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-cream/40">
                        +{project.tools.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                <motion.div
                  className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100"
                  style={{
                    boxShadow: "0 0 8px rgba(250, 219, 104, 0.6)",
                  }}
                />
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination controls - only show if needed */}
      {needsPagination && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 border-t border-teal/20">
          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl transition-all ${
              currentPage === 0
                ? "bg-dark-teal/30 text-cream/30 cursor-not-allowed"
                : "bg-blood-orange/80 hover:bg-blood-orange text-cream"
            }`}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Page indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                  index === currentPage
                    ? "bg-gold scale-125"
                    : "bg-teal/40 hover:bg-teal/60"
                }`}
                style={{
                  boxShadow: index === currentPage ? "0 0 8px rgba(250, 219, 104, 0.6)" : "none",
                }}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl transition-all ${
              currentPage === totalPages - 1
                ? "bg-dark-teal/30 text-cream/30 cursor-not-allowed"
                : "bg-blood-orange/80 hover:bg-blood-orange text-cream"
            }`}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Page counter */}
          <span
            className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-cream/60 font-black"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            {currentPage + 1} / {totalPages}
          </span>
        </div>
      )}
    </motion.div>
  );
}
