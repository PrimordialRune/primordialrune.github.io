"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(20);

  // Check if content is scrollable and track scroll progress
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollable = scrollHeight > clientHeight;
      setShowScrollIndicator(isScrollable);
      
      if (isScrollable) {
        const progress = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(Math.min(1, Math.max(0, progress)));
        // Calculate thumb height based on visible ratio
        const visibleRatio = clientHeight / scrollHeight;
        setThumbHeight(Math.max(20, visibleRatio * 100));
      }
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [project]);

  if (!project) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === project.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? project.images.length - 1 : prev - 1
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-peacock-blue rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-2 sm:border-3 md:border-4 border-teal"
          style={{
            boxShadow: `
              inset 4px 4px 8px rgba(0, 0, 0, 0.3),
              inset -4px -4px 8px rgba(255, 255, 255, 0.05),
              0 0 0 2px var(--teal),
              0 12px 40px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-blood-orange/90 hover:bg-blood-orange rounded-lg sm:rounded-xl text-cream font-black transition-all"
            style={{
              boxShadow: "0 4px 12px rgba(236, 86, 59, 0.4)",
            }}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>

          {/* Scrollable Content with custom scrollbar */}
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-[95vh] sm:max-h-[90vh] p-4 sm:p-6 md:p-8 modal-scrollbar"
          >
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3 pr-8 sm:pr-10">
                <div>
                  <h2
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-cream mb-1 sm:mb-2"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {project.title}
                  </h2>
                  {project.titleJp && (
                    <p
                      className="text-sm sm:text-base md:text-lg text-aquamarine/70 tracking-wider"
                      style={{ fontFamily: "var(--font-8bit-darling)" }}
                    >
                      {project.titleJp}
                    </p>
                  )}
                </div>
                <span
                  className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blood-orange rounded-lg sm:rounded-xl text-cream font-black text-sm sm:text-base md:text-lg flex-shrink-0"
                  style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                >
                  {project.year}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <span
                    className="text-[10px] sm:text-xs text-aquamarine font-black block mb-0.5 sm:mb-1"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    ROLE
                  </span>
                  <span className="text-xs sm:text-sm text-cream/80">{project.role}</span>
                </div>
                <div className="flex-1">
                  <span
                    className="text-[10px] sm:text-xs text-aquamarine font-black block mb-0.5 sm:mb-1"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    TOOLS
                  </span>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-dark-teal/60 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-cream/80 font-black"
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm md:text-base text-cream/70 leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

            {/* Image Gallery */}
            {project.images.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="relative aspect-video bg-dark-teal/40 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border-2 border-teal/40">
                  <img
                    src={project.images[currentImageIndex]}
                    alt={`${project.title} screenshot ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Scanline effect */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                    }}
                  />

                  {/* Navigation arrows */}
                  {project.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-blood-orange/80 hover:bg-blood-orange rounded-lg sm:rounded-xl transition-all"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cream"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-blood-orange/80 hover:bg-blood-orange rounded-lg sm:rounded-xl transition-all"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cream"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  <div
                    className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 bg-peacock-blue/80 backdrop-blur-sm rounded-md sm:rounded-lg text-cream text-xs sm:text-sm font-black"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {currentImageIndex + 1} / {project.images.length}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {project.images.length > 1 && (
                  <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-2">
                    {project.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-blood-orange scale-105"
                            : "border-teal/30 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Abstract/Detailed Description */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h3
                className="text-sm sm:text-base md:text-lg font-black text-aquamarine mb-2 sm:mb-3"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                ABOUT THIS PROJECT
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-cream/80 leading-relaxed">{project.abstract}</p>
            </div>

            {/* CTA Button */}
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 bg-blood-orange hover:bg-blood-orange/80 rounded-lg sm:rounded-xl text-cream font-black text-sm sm:text-base md:text-lg transition-all group"
              style={{
                fontFamily: "var(--font-fk-grotesk-black)",
                boxShadow: "0 8px 24px rgba(236, 86, 59, 0.4)",
              }}
            >
              VIEW CASE STUDY
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M7 4l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {/* Scroll Progress Indicator */}
          <AnimatePresence>
            {showScrollIndicator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-1 top-16 bottom-4 w-1.5 sm:w-2 z-20 pointer-events-none"
              >
                {/* Track */}
                <div className="absolute inset-0 bg-teal/20 rounded-full" />
                {/* Progress */}
                <motion.div
                  className="absolute top-0 left-0 right-0 bg-aquamarine/60 rounded-full"
                  style={{
                    height: `${thumbHeight}%`,
                  }}
                  animate={{
                    top: `${scrollProgress * (100 - thumbHeight)}%`,
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll hint at bottom when not scrolled */}
          <AnimatePresence>
            {showScrollIndicator && scrollProgress < 0.1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-20"
              >
                <span className="text-[10px] sm:text-xs text-cream/50 font-black" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>
                  SCROLL
                </span>
                <motion.svg
                  className="w-4 h-4 text-cream/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .modal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--aquamarine) transparent;
        }
        
        .modal-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: var(--teal);
          border-radius: 3px;
        }
        
        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--aquamarine);
        }
        
        /* Hide scrollbar on mobile */
        @media (max-width: 768px) {
          .modal-scrollbar::-webkit-scrollbar {
            width: 0;
            display: none;
          }
          .modal-scrollbar {
            scrollbar-width: none;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
