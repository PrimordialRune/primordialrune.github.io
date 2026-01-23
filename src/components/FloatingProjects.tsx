"use client";

import { motion } from "framer-motion";
import { Project } from "@/types/project";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface FloatingProjectsProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

// Calculate optimal grid layout based on container size and number of projects
function calculateLayout(
  containerWidth: number,
  containerHeight: number,
  projectCount: number
) {
  if (projectCount === 0) return { cols: 0, rows: 0, cardWidth: 0, cardHeight: 0 };

  // Calculate aspect ratio of container
  const containerAspect = containerWidth / containerHeight;
  
  // Try to find optimal grid that fills space well
  let bestCols = 1;
  let bestRows = projectCount;
  let bestScore = 0;

  for (let cols = 1; cols <= projectCount; cols++) {
    const rows = Math.ceil(projectCount / cols);
    
    // Calculate card dimensions for this grid
    const maxCardWidth = (containerWidth * 0.85) / cols;
    const maxCardHeight = (containerHeight * 0.85) / rows;
    
    // Maintain aspect ratio (width:height roughly 1:1.3 for card + label)
    const cardAspect = 1 / 1.3;
    let cardWidth, cardHeight;
    
    if (maxCardWidth / maxCardHeight > cardAspect) {
      // Height constrained
      cardHeight = maxCardHeight;
      cardWidth = cardHeight * cardAspect;
    } else {
      // Width constrained
      cardWidth = maxCardWidth;
      cardHeight = cardWidth / cardAspect;
    }
    
    // Score based on how well cards fill the space
    const totalCardArea = cardWidth * cardHeight * projectCount;
    const containerArea = containerWidth * containerHeight;
    const fillRatio = totalCardArea / containerArea;
    
    // Prefer layouts that fill 40-70% of space
    const idealFill = 0.55;
    const fillScore = 1 - Math.abs(fillRatio - idealFill);
    
    // Prefer more square-ish grids
    const gridAspect = cols / rows;
    const aspectScore = 1 - Math.abs(gridAspect - containerAspect) / Math.max(gridAspect, containerAspect);
    
    const score = fillScore * 0.6 + aspectScore * 0.4;
    
    if (score > bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }

  // Calculate final card dimensions
  const maxCardWidth = (containerWidth * 0.85) / bestCols;
  const maxCardHeight = (containerHeight * 0.85) / bestRows;
  const cardAspect = 1 / 1.3;
  
  let cardWidth, cardHeight;
  if (maxCardWidth / maxCardHeight > cardAspect) {
    cardHeight = maxCardHeight;
    cardWidth = cardHeight * cardAspect;
  } else {
    cardWidth = maxCardWidth;
    cardHeight = cardWidth / cardAspect;
  }

  // Clamp card size to reasonable bounds
  const minCardSize = 80;
  const maxCardSize = 200;
  cardWidth = Math.max(minCardSize, Math.min(maxCardSize, cardWidth));
  cardHeight = Math.max(minCardSize * 1.3, Math.min(maxCardSize * 1.3, cardHeight));

  return { cols: bestCols, rows: bestRows, cardWidth, cardHeight };
}

export default function FloatingProjects({
  projects,
  onProjectClick,
}: FloatingProjectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate layout
  const layout = useMemo(() => 
    calculateLayout(dimensions.width, dimensions.height, projects.length),
    [dimensions.width, dimensions.height, projects.length]
  );

  // Calculate position for each project
  const getPosition = useCallback((index: number) => {
    if (layout.cols === 0) return { x: 50, y: 50 };
    
    const row = Math.floor(index / layout.cols);
    const col = index % layout.cols;
    
    // Calculate spacing
    const totalGridWidth = layout.cols * layout.cardWidth;
    const totalGridHeight = layout.rows * layout.cardHeight;
    
    const horizontalPadding = (dimensions.width - totalGridWidth) / 2;
    const verticalPadding = (dimensions.height - totalGridHeight) / 2;
    
    // Add slight randomness for organic feel (±5% of card size)
    const randomOffsetX = (Math.sin(index * 137.508) * 0.05) * layout.cardWidth;
    const randomOffsetY = (Math.cos(index * 137.508) * 0.05) * layout.cardHeight;
    
    const x = horizontalPadding + col * layout.cardWidth + layout.cardWidth / 2 + randomOffsetX;
    const y = verticalPadding + row * layout.cardHeight + layout.cardHeight / 2 + randomOffsetY;
    
    return { x, y };
  }, [layout, dimensions]);

  // Generate unique floating animation for each project
  const getFloatingAnimation = useCallback((index: number) => {
    const seed = index * 137.508; // Golden angle for distribution
    const amplitude = Math.min(10, layout.cardWidth * 0.08);
    return {
      x: [0, Math.sin(seed) * amplitude, 0],
      y: [0, Math.cos(seed) * amplitude, 0],
      rotate: [0, Math.sin(seed) * 1.5, 0],
    };
  }, [layout.cardWidth]);

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p
            className="text-4xl sm:text-5xl md:text-6xl font-black text-aquamarine/30 mb-4"
            style={{ fontFamily: "var(--font-8bit-darling)" }}
          >
            準備中
          </p>
          <p className="text-base sm:text-lg md:text-xl text-cream/60">Projects coming soon...</p>
        </div>
      </div>
    );
  }

  // Calculate thumbnail size based on card size
  const thumbnailSize = Math.max(60, Math.min(160, layout.cardWidth * 0.9));
  const fontSize = Math.max(10, Math.min(14, layout.cardWidth * 0.08));

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Slow-moving scanline overlay for retro CRT effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, var(--teal) 3px, var(--teal) 5px)",
            animation: "floatingScanlines 20s linear infinite",
          }}
        />
      </div>

      {/* Virtual space container */}
      <div className="absolute inset-0">
        {dimensions.width > 0 && projects.map((project, index) => {
          const position = getPosition(index);
          const floating = getFloatingAnimation(index);
          const duration = 8 + (index % 4) * 2; // 8-14s varied durations

          return (
            <motion.button
              key={project.slug}
              onClick={() => onProjectClick(project)}
              className="group absolute"
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                delay: index * 0.08,
              }}
              whileHover={{ scale: 1.1, zIndex: 50 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Floating animation wrapper */}
              <motion.div
                animate={floating}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Icon/Card - 90s desktop/console style */}
                <div 
                  className="flex flex-col items-center gap-1 sm:gap-2"
                  style={{ width: thumbnailSize + 16 }}
                >
                  {/* Thumbnail container - like desktop icon */}
                  <div
                    className="relative bg-dark-teal/60 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border-2 sm:border-3 md:border-4 border-teal/40 group-hover:border-aquamarine transition-all"
                    style={{
                      width: thumbnailSize,
                      height: thumbnailSize,
                      boxShadow: `
                        inset 2px 2px 4px rgba(0, 0, 0, 0.3),
                        inset -2px -2px 4px rgba(255, 255, 255, 0.05),
                        0 4px 12px rgba(0, 0, 0, 0.3)
                      `,
                    }}
                  >
                    {/* Thumbnail */}
                    {project.thumbnail && (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Scanline effect on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
                      }}
                    />

                    {/* Year badge - top right */}
                    <div
                      className="absolute top-1 right-1 px-1 sm:px-1.5 md:px-2 py-0.5 bg-blood-orange/90 backdrop-blur-sm rounded text-cream font-black"
                      style={{ 
                        fontFamily: "var(--font-fk-grotesk-black)",
                        fontSize: Math.max(8, fontSize * 0.75)
                      }}
                    >
                      {project.year}
                    </div>

                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{
                        boxShadow: "inset 0 0 20px rgba(78, 185, 159, 0.3)",
                      }}
                    />
                  </div>

                  {/* Label - below icon like desktop */}
                  <div 
                    className="text-center px-1 sm:px-2 py-0.5 sm:py-1 bg-dark-teal/80 backdrop-blur-sm rounded-md sm:rounded-lg border border-teal/30 group-hover:border-aquamarine/50 transition-all max-w-full"
                  >
                    <p
                      className="font-black text-cream leading-tight truncate"
                      style={{ 
                        fontFamily: "var(--font-fk-grotesk-black)",
                        fontSize
                      }}
                    >
                      {project.title}
                    </p>
                    {project.titleJp && (
                      <p
                        className="text-aquamarine/70 tracking-wide truncate"
                        style={{ 
                          fontFamily: "var(--font-8bit-darling)",
                          fontSize: Math.max(8, fontSize * 0.75)
                        }}
                      >
                        {project.titleJp}
                      </p>
                    )}
                  </div>

                  {/* Active indicator on hover */}
                  <motion.div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100"
                    style={{
                      boxShadow: "0 0 8px rgba(250, 219, 104, 0.6)",
                    }}
                    initial={false}
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* CSS Animation for Floating Scanlines */}
      <style jsx>{`
        @keyframes floatingScanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(8px);
          }
        }
      `}</style>
    </div>
  );
}
