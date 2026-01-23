"use client";

import { motion } from "framer-motion";
import { Project } from "@/types/project";

interface FloatingProjectsProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export default function FloatingProjects({
  projects,
  onProjectClick,
}: FloatingProjectsProps) {
  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p
            className="text-6xl font-black text-aquamarine/30 mb-4"
            style={{ fontFamily: "var(--font-8bit-darling)" }}
          >
            準備中
          </p>
          <p className="text-xl text-cream/60">Projects coming soon...</p>
        </div>
      </div>
    );
  }

  // Calculate positions in a loose grid pattern
  // Avoid left side (navigation area - first ~500px)
  const getPosition = (index: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Start from 30% from left to avoid nav area
    const baseX = 35 + (col * (60 / cols)); // 35-95% horizontal range
    const baseY = 15 + (row * (70 / Math.ceil(total / cols))); // 15-85% vertical range

    return { x: baseX, y: baseY };
  };

  // Generate unique floating animation for each project
  const getFloatingAnimation = (index: number) => {
    const seed = index * 137.508; // Golden angle for distribution
    return {
      x: [0, Math.sin(seed) * 15, 0],
      y: [0, Math.cos(seed) * 15, 0],
      rotate: [0, Math.sin(seed) * 2, 0],
    };
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
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
        {projects.map((project, index) => {
          const position = getPosition(index, projects.length);
          const floating = getFloatingAnimation(index);
          const duration = 8 + (index % 4) * 2; // 8-14s varied durations

          return (
            <motion.button
              key={project.slug}
              onClick={() => onProjectClick(project)}
              className="group absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                delay: index * 0.1,
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
                <div className="flex flex-col items-center gap-2 w-44">
                  {/* Thumbnail container - like desktop icon */}
                  <div
                    className="relative w-40 h-40 bg-dark-teal/60 backdrop-blur-sm rounded-2xl overflow-hidden border-4 border-teal/40 group-hover:border-aquamarine transition-all"
                    style={{
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
                      className="absolute top-2 right-2 px-2 py-1 bg-blood-orange/90 backdrop-blur-sm rounded text-cream text-xs font-black"
                      style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
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
                  <div className="text-center px-2 py-1 bg-dark-teal/80 backdrop-blur-sm rounded-lg border border-teal/30 group-hover:border-aquamarine/50 transition-all max-w-full">
                    <p
                      className="text-sm font-black text-cream leading-tight truncate"
                      style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                    >
                      {project.title}
                    </p>
                    {project.titleJp && (
                      <p
                        className="text-xs text-aquamarine/70 tracking-wide truncate"
                        style={{ fontFamily: "var(--font-8bit-darling)" }}
                      >
                        {project.titleJp}
                      </p>
                    )}
                  </div>

                  {/* Active indicator on hover */}
                  <motion.div
                    className="w-2 h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100"
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
