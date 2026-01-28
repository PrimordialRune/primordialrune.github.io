"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { AstroidSparkle } from "@/components/AstroidSparkle";
import { seededRandom } from "@/lib/utils";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  isDiscoverMode?: boolean;
}

export default function ProjectModal({ project, onClose, isDiscoverMode = false }: ProjectModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(20);
  const [showSparkles, setShowSparkles] = useState(isDiscoverMode);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop for 3D effects (only on desktop)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Handle mouse movement for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  // Calculate 3D tilt - Pokemon-card-like effect (desktop only)
  // Mouse Y controls up/down rotation, Mouse X controls left/right rotation
  const tiltX = isDesktop && isHovered ? (mousePosition.y - 0.5) * -12 : 0;
  const tiltY = isDesktop && isHovered ? (mousePosition.x - 0.5) * 12 : 0;

  // Generate sparkle positions for discover mode using seeded random
  const discoverSparkles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: 5 + seededRandom(i * 137.5) * 90,
      top: 5 + seededRandom(i * 247.1) * 90,
      delay: seededRandom(i * 317.3) * 0.5,
      opacity: 0.5 + seededRandom(i * 421.7) * 0.5,
      size: 10 + seededRandom(i * 523.9) * 20,
      duration: 1 + seededRandom(i * 631.1) * 0.5,
    }));
  }, []);

  // Hide sparkles after entrance animation - sparkles start visible via initial state
  useEffect(() => {
    if (isDiscoverMode && showSparkles) {
      const timer = setTimeout(() => setShowSparkles(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isDiscoverMode, showSparkles]);

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

  // Color scheme based on discover mode
  const borderColor = isDiscoverMode ? "var(--blood-orange)" : "var(--teal)";

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

        {/* Discover Mode Sparkles */}
        <AnimatePresence>
          {showSparkles && isDiscoverMode && (
            <>
              {discoverSparkles.map((sparkle) => (
                <motion.div
                  key={`discover-sparkle-${sparkle.id}`}
                  className="absolute pointer-events-none z-[110]"
                  style={{
                    left: `${sparkle.left}%`,
                    top: `${sparkle.top}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [0, sparkle.opacity, sparkle.opacity * 0.5, 0],
                    scale: [0, 1.5, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    duration: sparkle.duration,
                    delay: sparkle.delay,
                    ease: "easeOut"
                  }}
                >
                  <AstroidSparkle size={sparkle.size} color="var(--gold)" opacity={1} />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Modal Content with enhanced 3D tilt effect */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 5 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: isDesktop && isHovered ? -6 : 0,  // Slight lift on hover (desktop only)
            rotateX: tiltX,
            rotateY: tiltY,
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            rotateX: { type: "spring", stiffness: 300, damping: 25 },
            rotateY: { type: "spring", stiffness: 300, damping: 25 },
            y: { type: "spring", stiffness: 300, damping: 25 },
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden ${
            isDiscoverMode ? "bg-blood-orange" : "bg-peacock-blue"
          }`}
          style={{
            border: `4px solid ${isDiscoverMode ? "var(--gold)" : "var(--teal)"}`,
            transformStyle: isDesktop ? "preserve-3d" : "flat",
            perspective: isDesktop ? "1200px" : "none",
            boxShadow: isDesktop && isHovered
              ? isDiscoverMode
                ? `
                  inset 6px 6px 12px rgba(0, 0, 0, 0.25),
                  inset -6px -6px 12px rgba(255, 255, 255, 0.12),
                  0 0 0 3px var(--gold),
                  0 0 50px rgba(250, 219, 104, 0.4),
                  0 25px 60px rgba(0, 0, 0, 0.6),
                  0 8px 20px rgba(250, 219, 104, 0.2)
                `
                : `
                  inset 6px 6px 12px rgba(0, 0, 0, 0.35),
                  inset -6px -6px 12px rgba(255, 255, 255, 0.08),
                  0 0 0 3px var(--teal),
                  0 0 40px rgba(51, 153, 153, 0.3),
                  0 25px 60px rgba(0, 0, 0, 0.6),
                  0 8px 20px rgba(51, 153, 153, 0.15)
                `
              : isDiscoverMode
                ? `
                  inset 4px 4px 8px rgba(0, 0, 0, 0.2),
                  inset -4px -4px 8px rgba(255, 255, 255, 0.1),
                  0 0 0 2px var(--gold),
                  0 0 30px rgba(250, 219, 104, 0.3),
                  0 12px 40px rgba(0, 0, 0, 0.5)
                `
                : `
                  inset 4px 4px 8px rgba(0, 0, 0, 0.3),
                  inset -4px -4px 8px rgba(255, 255, 255, 0.05),
                  0 0 0 2px var(--teal),
                  0 12px 40px rgba(0, 0, 0, 0.5)
              `,
          }}
        >
          {/* 3D highlight edge effect - desktop only, follows mouse position */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDesktop && isHovered
                ? `linear-gradient(${
                    Math.atan2(
                      mousePosition.y - 0.5,
                      mousePosition.x - 0.5
                    ) * (180 / Math.PI) + 90
                  }deg,
                    rgba(255, 255, 255, 0.15) 0%,
                    transparent 50%,
                    rgba(0, 0, 0, 0.1) 100%)`
                : 'none',
              borderRadius: 'inherit',
            }}
          />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg sm:rounded-xl font-black transition-all ${
              isDiscoverMode
                ? "bg-gold/90 hover:bg-gold text-peacock-blue"
                : "bg-blood-orange/90 hover:bg-blood-orange text-cream"
            }`}
            style={{
              boxShadow: isDiscoverMode
                ? "0 4px 12px rgba(250, 219, 104, 0.4)"
                : "0 4px 12px rgba(236, 86, 59, 0.4)",
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
              <div className="flex items-start gap-2 sm:gap-4 mb-2 sm:mb-3 pr-10 sm:pr-12 md:pr-14">
                <div className="flex-1">
                  <h2
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-cream mb-1 sm:mb-2"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {project.title}
                  </h2>
                  {project.titleJp && (
                    <p
                      className="text-sm sm:text-base md:text-lg tracking-wider"
                      style={{
                        fontFamily: "var(--font-gen-ei-kiwami)",
                        color: isDiscoverMode ? "var(--gold)" : "rgba(78, 185, 159, 0.7)"
                      }}
                    >
                      {project.titleJp}
                    </p>
                  )}
                </div>
                {/* Year badge - now on the right after title */}
                <span
                  className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl font-black text-sm sm:text-base md:text-lg flex-shrink-0 mt-1 ${
                    isDiscoverMode
                      ? "bg-gold text-peacock-blue"
                      : "bg-blood-orange text-cream"
                  }`}
                  style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                >
                  {project.year}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <span
                    className="text-[10px] sm:text-xs font-black block mb-0.5 sm:mb-1"
                    style={{ 
                      fontFamily: "var(--font-fk-grotesk-black)",
                      color: isDiscoverMode ? "var(--gold)" : "var(--aquamarine)"
                    }}
                  >
                    ROLE
                  </span>
                  <span className="text-xs sm:text-sm text-cream/80">{project.role}</span>
                </div>
                <div className="flex-1">
                  <span
                    className="text-[10px] sm:text-xs font-black block mb-0.5 sm:mb-1"
                    style={{ 
                      fontFamily: "var(--font-fk-grotesk-black)",
                      color: isDiscoverMode ? "var(--gold)" : "var(--aquamarine)"
                    }}
                  >
                    TOOLS
                  </span>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black ${
                          isDiscoverMode
                            ? "bg-cream/20 text-cream"
                            : "bg-dark-teal/60 text-cream/80"
                        }`}
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
                <div className={`relative aspect-video rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border-2 ${
                  isDiscoverMode
                    ? "bg-peacock-blue/60 border-gold/60"
                    : "bg-dark-teal/40 border-teal/40"
                }`}>
                  <img
                    src={project.images[currentImageIndex]}
                    alt={`${project.title} screenshot ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Scanline effect */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: isDiscoverMode
                        ? "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--gold) 2px, var(--gold) 4px)"
                        : "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                    }}
                  />

                  {/* Navigation arrows */}
                  {project.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                          isDiscoverMode
                            ? "bg-gold/80 hover:bg-gold text-peacock-blue"
                            : "bg-blood-orange/80 hover:bg-blood-orange text-cream"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
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
                        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                          isDiscoverMode
                            ? "bg-gold/80 hover:bg-gold text-peacock-blue"
                            : "bg-blood-orange/80 hover:bg-blood-orange text-cream"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
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
                    className={`absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 backdrop-blur-sm rounded-md sm:rounded-lg text-xs sm:text-sm font-black ${
                      isDiscoverMode
                        ? "bg-gold/80 text-peacock-blue"
                        : "bg-peacock-blue/80 text-cream"
                    }`}
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
                            ? isDiscoverMode
                              ? "border-gold scale-105"
                              : "border-blood-orange scale-105"
                            : isDiscoverMode
                              ? "border-cream/30 opacity-60 hover:opacity-100"
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
                className="text-sm sm:text-base md:text-lg font-black mb-2 sm:mb-3"
                style={{ 
                  fontFamily: "var(--font-fk-grotesk-black)",
                  color: isDiscoverMode ? "var(--gold)" : "var(--aquamarine)"
                }}
              >
                ABOUT THIS PROJECT
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-cream/80 leading-relaxed">{project.abstract}</p>
            </div>

            {/* CTA Button */}
            <Link
              href={`/projects/${project.slug}`}
              className={`inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black text-sm sm:text-base md:text-lg transition-all group ${
                isDiscoverMode
                  ? "bg-gold hover:bg-gold/90 text-peacock-blue"
                  : "bg-blood-orange hover:bg-blood-orange/80 text-cream"
              }`}
              style={{
                fontFamily: "var(--font-fk-grotesk-black)",
                boxShadow: isDiscoverMode
                  ? "0 8px 24px rgba(250, 219, 104, 0.5), 0 0 20px rgba(250, 219, 104, 0.3)"
                  : "0 8px 24px rgba(236, 86, 59, 0.4)",
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
                <div className={`absolute inset-0 rounded-full ${
                  isDiscoverMode ? "bg-cream/20" : "bg-teal/20"
                }`} />
                {/* Progress */}
                <motion.div
                  className={`absolute top-0 left-0 right-0 rounded-full ${
                    isDiscoverMode ? "bg-gold/80" : "bg-aquamarine/60"
                  }`}
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
