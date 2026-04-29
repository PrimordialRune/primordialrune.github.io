"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Project } from "@/types/project";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface FloatingProjectsProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

// Seeded random number generator for consistent but random positions
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Calculate size variation based on importance (1-5 scale) with 3 proportioned tiers
// Small (1-2): 0.7x base, Medium (3): 1.0x base, Large (4-5): 1.3x base
function getSizeVariation(importance: number = 3, baseSize: number): number {
  if (importance <= 2) {
    return baseSize * 0.7; // Small tier
  } else if (importance >= 4) {
    return baseSize * 1.3; // Large tier
  }
  return baseSize; // Medium tier (importance 3)
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [projectPositions, setProjectPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  // Track position version to force clean re-render after drag (prevents transform accumulation)
  const [positionVersion, setPositionVersion] = useState<Map<string, number>>(new Map());
  // Track projects that just landed (for landing animation)
  const [landingProjects, setLandingProjects] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Generate random seed on mount for position randomization
  const [randomSeed] = useState(() => Math.random() * 1000);
  const [showMoveHint, setShowMoveHint] = useState(true);

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

  useEffect(() => {
    const hideHint = () => setShowMoveHint(false);
    window.addEventListener("primordialrune:discover-triggered", hideHint);
    return () => window.removeEventListener("primordialrune:discover-triggered", hideHint);
  }, []);

  // Calculate layout
  const layout = useMemo(() => 
    calculateLayout(dimensions.width, dimensions.height, projects.length),
    [dimensions.width, dimensions.height, projects.length]
  );

  // Calculate initial position for each project with randomization
  // Spawns projects across the full content panel area
  const getInitialPosition = useCallback((index: number, _slug: string) => {
    if (layout.cols === 0) return { x: 50, y: 50 };
    
    const row = Math.floor(index / layout.cols);
    const col = index % layout.cols;
    
    // Use 95% of available space for spawning
    const usableWidth = dimensions.width * 0.95;
    const usableHeight = dimensions.height * 0.95;
    
    // Calculate spacing based on usable area
    const totalGridWidth = layout.cols * layout.cardWidth;
    const totalGridHeight = layout.rows * layout.cardHeight;
    
    // Scale to fill the usable area better
    const scaleX = Math.min(1.2, usableWidth / totalGridWidth);
    const scaleY = Math.min(1.2, usableHeight / totalGridHeight);
    
    const scaledGridWidth = totalGridWidth * scaleX;
    const scaledGridHeight = totalGridHeight * scaleY;
    
    const horizontalPadding = (dimensions.width - scaledGridWidth) / 2;
    const verticalPadding = (dimensions.height - scaledGridHeight) / 2;
    
    // Add random offset using seeded random for consistent but random positions (±20% of card size)
    const seed1 = randomSeed + index * 137.508;
    const seed2 = randomSeed + index * 247.123;
    const randomOffsetX = (seededRandom(seed1) - 0.5) * 0.4 * layout.cardWidth * scaleX;
    const randomOffsetY = (seededRandom(seed2) - 0.5) * 0.4 * layout.cardHeight * scaleY;
    
    const cellWidth = scaledGridWidth / layout.cols;
    const cellHeight = scaledGridHeight / layout.rows;
    
    const x = horizontalPadding + col * cellWidth + cellWidth / 2 + randomOffsetX;
    const y = verticalPadding + row * cellHeight + cellHeight / 2 + randomOffsetY;
    
    // Ensure within bounds
    const padding = 60;
    const clampedX = Math.max(padding, Math.min(dimensions.width - padding, x));
    const clampedY = Math.max(padding, Math.min(dimensions.height - padding, y));
    
    return { x: clampedX, y: clampedY };
  }, [layout, dimensions, randomSeed]);

  // Get current position (either from saved positions or calculate initial)
  const getPosition = useCallback((index: number, slug: string) => {
    const savedPosition = projectPositions.get(slug);
    if (savedPosition) {
      return savedPosition;
    }
    return getInitialPosition(index, slug);
  }, [projectPositions, getInitialPosition]);

  // Check if two projects overlap
  const checkCollision = useCallback((pos1: { x: number; y: number }, pos2: { x: number; y: number }, minDistance: number) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy) < minDistance;
  }, []);

  // Push overlapping projects away from the dropped project
  const resolveCollisions = useCallback((
    droppedSlug: string,
    droppedPos: { x: number; y: number },
    currentPositions: Map<string, { x: number; y: number }>
  ) => {
    // Collision detection spacing multiplier - projects need 1.2x card width apart
    const COLLISION_SPACING_MULTIPLIER = 1.2;
    const minDistance = layout.cardWidth * COLLISION_SPACING_MULTIPLIER;
    const padding = 60;
    const newPositions = new Map(currentPositions);
    
    projects.forEach((project, index) => {
      if (project.slug === droppedSlug) return;
      
      const pos = newPositions.get(project.slug) || getInitialPosition(index, project.slug);
      
      if (checkCollision(droppedPos, pos, minDistance)) {
        // Calculate push direction
        let dx = pos.x - droppedPos.x;
        let dy = pos.y - droppedPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and scale
        if (dist > 0) {
          dx = (dx / dist) * (minDistance - dist + 20);
          dy = (dy / dist) * (minDistance - dist + 20);
        } else {
          // If exactly on top, push using deterministic direction based on project index
          // Use index-based angle to ensure consistent behavior
          const angle = (index * 137.508) % 360 * (Math.PI / 180); // Golden angle distribution
          dx = Math.cos(angle) * minDistance;
          dy = Math.sin(angle) * minDistance;
        }
        
        // Calculate new position with bounds clamping
        const newX = Math.max(padding, Math.min(dimensions.width - padding, pos.x + dx));
        const newY = Math.max(padding, Math.min(dimensions.height - padding, pos.y + dy));
        
        newPositions.set(project.slug, { x: newX, y: newY });
      }
    });
    
    return newPositions;
  }, [projects, layout.cardWidth, dimensions, getInitialPosition, checkCollision]);

  // Handle drag end - save new position and resolve collisions
  const handleDragEnd = useCallback((slug: string, info: PanInfo) => {
    // Use the absolute pointer position converted to container-local coordinates.
    // Using info.offset + currentPos can drift due to the floating animation transform
    // being applied on an inner element — info.point is always accurate.
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = info.point.x - containerRect.left;
    const newY = info.point.y - containerRect.top;

    // Clamp position to container bounds with proper padding
    const padding = 60;
    const clampedX = Math.max(padding, Math.min(dimensions.width - padding, newX));
    const clampedY = Math.max(padding, Math.min(dimensions.height - padding, newY));

    const droppedPos = { x: clampedX, y: clampedY };

    // Mark this project as landing (for bump animation)
    setLandingProjects(prev => new Set(prev).add(slug));

    // Update position and increment version to force clean re-render
    // This ensures Framer Motion's drag transform is reset with fresh component state
    setProjectPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(slug, droppedPos);
      return newMap;
    });

    // Increment version to force component re-mount with clean transform state
    setPositionVersion(prev => {
      const newMap = new Map(prev);
      newMap.set(slug, (prev.get(slug) || 0) + 1);
      return newMap;
    });

    // Resolve collisions after position is set
    setTimeout(() => {
      setProjectPositions(prev => {
        return resolveCollisions(slug, droppedPos, prev);
      });
    }, 50);

    // Clear landing state after animation completes
    setTimeout(() => {
      setLandingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(slug);
        return newSet;
      });
    }, 400);

    setShowMoveHint(false);
    setIsDragging(false);
    setDraggedIndex(null);
  }, [dimensions, resolveCollisions]);

  // Long press handlers
  const handlePointerDown = useCallback((index: number) => {
    setShowMoveHint(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setDraggedIndex(index);
      setIsDragging(true);
    }, 220); // 220ms long press to feel responsive on touch devices
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
            style={{ fontFamily: "var(--font-gen-ei-kiwami)" }}
          >
            準備中
          </p>
          <p className="text-base sm:text-lg md:text-xl text-cream/60">Projects coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Background decorative elements - matching HeroSection */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="floatingGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--teal)" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#floatingGrid)" />
        </svg>
        
        {/* Floating particles — CSS-animated to stay off the JS thread */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`floating-particle-${i}`}
            className={`absolute rounded-full ${i % 3 === 0 ? "bg-aquamarine/20" : i % 3 === 1 ? "bg-blood-orange/15" : "bg-gold/15"}`}
            style={{
              width: 2 + (i % 3) * 2,
              height: 2 + (i % 3) * 2,
              left: `${8 + (i * 11)}%`,
              top: `${12 + ((i * 23) % 70)}%`,
              animation: `fp-float ${6 + (i % 4)}s ease-in-out ${i * 0.5}s infinite`,
            }}
          />
        ))}

        {/* Ambient glow orbs — CSS-animated */}
        <div
          className="absolute w-32 h-32 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(78, 185, 159, 0.06) 0%, transparent 70%)",
            top: "15%",
            right: "15%",
            animation: "fp-orb1 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(236, 86, 59, 0.04) 0%, transparent 70%)",
            bottom: "25%",
            left: "20%",
            animation: "fp-orb2 12s ease-in-out 3s infinite",
          }}
        />
      </div>
      
      {/* Slow-moving scanline overlay for retro CRT effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--teal) 2px, var(--teal) 4px)",
            animation: "floatingScanlines 20s linear infinite",
          }}
        />
      </div>

      {/* CRT vignette — peripheral darkening toward corners */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />

      <AnimatePresence>
        {showMoveHint && (
          <motion.div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-3 sm:px-4 py-1.5 rounded-full bg-peacock-blue/80 border border-aquamarine/40 backdrop-blur-sm">
              <p
                className="text-[10px] sm:text-xs tracking-wider text-cream/90 whitespace-nowrap"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                HOLD + DRAG PROJECTS IN THE SPACE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual space container */}
      <div className="absolute inset-0">
        {dimensions.width > 0 && projects.map((project, index) => {
          const position = getPosition(index, project.slug);
          const floating = getFloatingAnimation(index);
          const duration = 8 + (index % 4) * 2; // 8-14s varied durations
          const isBeingDragged = draggedIndex === index;
          const isLanding = landingProjects.has(project.slug);
          
          // Calculate thumbnail size with importance-based variation
          const baseThumbnailSize = Math.max(60, Math.min(160, layout.cardWidth * 0.9));
          const thumbnailSize = getSizeVariation(project.importance || 3, baseThumbnailSize);
          const fontSize = Math.max(10, Math.min(14, layout.cardWidth * 0.08));

          // Include version in key to force clean re-mount after drag
          const version = positionVersion.get(project.slug) || 0;

          return (
            <motion.div
              key={`${project.slug}-v${version}`}
              className="absolute"
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -50%)",
                zIndex: isBeingDragged ? 100 : 1,
                touchAction: "none",
                willChange: isBeingDragged ? "transform" : "auto",
              }}
              initial={isLanding 
                ? { opacity: 1, scale: 1, y: -8 }  // Landing: start slightly elevated
                : { opacity: 0, scale: 0 }          // Initial spawn: pop in
              }
              animate={{
                opacity: 1,
                scale: isLanding ? [1, 1.05, 0.98, 1] : 1,  // Landing: bump sequence
                y: isLanding ? [-8, 0, 2, 0] : 0,           // Landing: drop and bounce
              }}
              transition={isLanding 
                ? {
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    scale: { duration: 0.35, times: [0, 0.4, 0.7, 1] },
                    y: { duration: 0.35, times: [0, 0.4, 0.7, 1] },
                  }
                : {
                    type: "spring",
                    damping: 20,
                    stiffness: 100,
                    delay: index * 0.08,
                    // Disable position animation after drag to prevent jumping
                    left: { type: "tween", duration: 0 },
                    top: { type: "tween", duration: 0 },
                  }
              }
              drag={isBeingDragged}
              dragConstraints={containerRef}
              dragElastic={0.1}
              dragMomentum={false}
              onDragEnd={(_, info) => handleDragEnd(project.slug, info)}
              onPointerDown={() => handlePointerDown(index)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              whileHover={!isDragging ? { scale: 1.1, zIndex: 50 } : undefined}
              whileTap={!isDragging ? { scale: 0.95 } : undefined}
            >
              {/* Floating animation wrapper - disabled while dragging */}
              <motion.div
                animate={!isBeingDragged ? floating : undefined}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <button
                  onClick={() => {
                    if (!isDragging) {
                      onProjectClick(project);
                    }
                  }}
                  className="group no-touch-callout"
                  type="button"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Icon/Card - 90s desktop/console style */}
                  <motion.div 
                    className="flex flex-col items-center gap-1 sm:gap-2"
                    style={{ width: thumbnailSize + 16 }}
                    animate={{
                      y: isBeingDragged ? -12 : 0,  // Lift up when dragging
                    }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    }}
                  >
                    {/* Thumbnail container - like desktop icon */}
                    <motion.div
                      className={`relative bg-dark-teal/60 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border-2 sm:border-3 md:border-4 transition-colors ${
                        isBeingDragged 
                          ? "border-gold" 
                          : "border-teal/40 group-hover:border-aquamarine"
                      }`}
                      style={{
                        width: thumbnailSize,
                        height: thumbnailSize,
                      }}
                      animate={{
                        boxShadow: isBeingDragged 
                          ? `0 20px 40px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(250, 219, 104, 0.3), inset 2px 2px 4px rgba(0, 0, 0, 0.3)`
                          : isLanding
                            ? `0 4px 8px rgba(0, 0, 0, 0.3), inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.05)`
                            : `inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3)`,
                      }}
                      transition={{
                        boxShadow: { 
                          type: "spring", 
                          damping: 25, 
                          stiffness: 200 
                        },
                      }}
                    >
                      {/* Thumbnail */}
                      {project.thumbnail && (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          draggable={false}
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

                      {/* Drag indicator when being dragged */}
                      {isBeingDragged && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 text-peacock-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            </svg>
                          </motion.div>
                        </div>
                      )}

                      {/* Glow on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                          boxShadow: "inset 0 0 20px rgba(78, 185, 159, 0.3)",
                        }}
                      />
                    </motion.div>

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
                            fontFamily: "var(--font-gen-ei-kiwami)",
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
                  </motion.div>
                </button>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes floatingScanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(8px); }
        }
        @keyframes fp-float {
          0%, 100% { transform: translateY(0); opacity: 0.12; }
          50% { transform: translateY(-18px); opacity: 0.35; }
        }
        @keyframes fp-orb1 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes fp-orb2 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
