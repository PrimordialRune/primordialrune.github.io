"use client";

import { motion } from "framer-motion";
import { Project } from "@/types/project";
import Image from "next/image";

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export default function ProjectGrid({
  projects,
  onProjectClick,
}: ProjectGridProps) {
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
          <p className="text-xl text-cream/60">
            Projects coming soon...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-12 py-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {projects.map((project) => (
          <motion.button
            key={project.slug}
            onClick={() => onProjectClick(project)}
            className="group relative bg-dark-teal/40 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-teal/30 hover:border-aquamarine transition-all"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
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
                className="absolute top-3 right-3 px-3 py-1 bg-blood-orange/90 backdrop-blur-sm rounded-lg text-cream text-sm font-black"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                {project.year}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 text-left">
              {/* Title */}
              <h3
                className="text-xl font-black text-cream mb-1 group-hover:text-aquamarine transition-colors"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                {project.title}
              </h3>

              {/* Japanese Title */}
              {project.titleJp && (
                <p
                  className="text-xs text-aquamarine/60 mb-3 tracking-wider"
                  style={{ fontFamily: "var(--font-8bit-darling)" }}
                >
                  {project.titleJp}
                </p>
              )}

              {/* Short Description */}
              <p className="text-sm text-cream/70 mb-4 line-clamp-2">
                {project.shortDescription}
              </p>

              {/* Role */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-aquamarine/80 font-black">
                  ROLE:
                </span>
                <span className="text-xs text-cream/60">{project.role}</span>
              </div>

              {/* Tools */}
              <div className="flex flex-wrap gap-2">
                {project.tools.slice(0, 3).map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-1 bg-peacock-blue/60 rounded text-xs text-aquamarine/80 font-black"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {tool}
                  </span>
                ))}
                {project.tools.length > 3 && (
                  <span className="px-2 py-1 text-xs text-cream/40">
                    +{project.tools.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Hover indicator */}
            <motion.div
              className="absolute bottom-3 right-3 w-2 h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100"
              style={{
                boxShadow: "0 0 8px rgba(250, 219, 104, 0.6)",
              }}
            />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
