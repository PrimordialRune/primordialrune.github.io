"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { useState } from "react";
import Link from "next/link";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
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
          className="relative w-full max-w-5xl max-h-[90vh] bg-peacock-blue rounded-3xl overflow-hidden border-4 border-teal"
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
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-blood-orange/90 hover:bg-blood-orange rounded-xl text-cream font-black transition-all"
            style={{
              boxShadow: "0 4px 12px rgba(236, 86, 59, 0.4)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[90vh] p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2
                    className="text-4xl font-black text-cream mb-2"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {project.title}
                  </h2>
                  {project.titleJp && (
                    <p
                      className="text-lg text-aquamarine/70 tracking-wider"
                      style={{ fontFamily: "var(--font-8bit-darling)" }}
                    >
                      {project.titleJp}
                    </p>
                  )}
                </div>
                <span
                  className="px-4 py-2 bg-blood-orange rounded-xl text-cream font-black text-lg flex-shrink-0"
                  style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                >
                  {project.year}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div>
                  <span
                    className="text-xs text-aquamarine font-black block mb-1"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    ROLE
                  </span>
                  <span className="text-sm text-cream/80">{project.role}</span>
                </div>
                <div className="flex-1">
                  <span
                    className="text-xs text-aquamarine font-black block mb-1"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    TOOLS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1 bg-dark-teal/60 rounded-lg text-xs text-cream/80 font-black"
                        style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-cream/70 leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

            {/* Image Gallery */}
            {project.images.length > 0 && (
              <div className="mb-6">
                <div className="relative aspect-video bg-dark-teal/40 rounded-2xl overflow-hidden border-2 border-teal/40">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-blood-orange/80 hover:bg-blood-orange rounded-xl transition-all"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="text-cream"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-blood-orange/80 hover:bg-blood-orange rounded-xl transition-all"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="text-cream"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  <div
                    className="absolute bottom-4 right-4 px-3 py-1 bg-peacock-blue/80 backdrop-blur-sm rounded-lg text-cream text-sm font-black"
                    style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
                  >
                    {currentImageIndex + 1} / {project.images.length}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {project.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {project.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
            <div className="mb-8">
              <h3
                className="text-lg font-black text-aquamarine mb-3"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                ABOUT THIS PROJECT
              </h3>
              <p className="text-cream/80 leading-relaxed">{project.abstract}</p>
            </div>

            {/* CTA Button */}
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center gap-3 px-6 py-4 bg-blood-orange hover:bg-blood-orange/80 rounded-xl text-cream font-black text-lg transition-all group"
              style={{
                fontFamily: "var(--font-fk-grotesk-black)",
                boxShadow: "0 8px 24px rgba(236, 86, 59, 0.4)",
              }}
            >
              VIEW CASE STUDY
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="group-hover:translate-x-1 transition-transform"
              >
                <path d="M7 4l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
