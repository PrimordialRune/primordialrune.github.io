"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import PauseMenu, { PauseMotion } from "@/components/PauseMenu";
import CRTScreen from "@/components/CRTScreen";
import PowerOn from "@/components/PowerOn";
import TitleScreen, { EmblemKind } from "@/components/TitleScreen";
import type { EmblemBackend } from "@/components/Emblem3D";
import { gsap } from "gsap";
import DiscoverButton from "@/components/DiscoverButton";
import ProjectGrid from "@/components/ProjectGrid";
import FloatingProjects from "@/components/FloatingProjects";
import ProjectModal from "@/components/ProjectModal";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";
import { getProjectsByCategory, getAllProjects } from "@/lib/projects";
import { sections, getSection } from "@/lib/sections";
import { triggerBurst } from "@/lib/crt";
import { writeSave, addPlayTime, readPowered, writePowered } from "@/lib/save";
import { useGamepadKeys } from "@/lib/useGamepadKeys";

const PLAY_TICK_SECONDS = 15;
const MOTIONS: { id: PauseMotion; label: string }[] = [
  { id: "slash", label: "SLASH" },
  { id: "cutin", label: "CUT-IN" },
  { id: "ribbon", label: "RIBBON" },
];
const MOTION_KEY = "primordialrune:pause-motion";
const EMBLEMS: { id: EmblemKind; label: string }[] = [
  { id: "flat", label: "FLAT" },
  { id: "3d", label: "3D" },
];
const EMBLEM_KEY = "primordialrune:emblem";
const SPEEDS = [1, 0.5, 0.2];
const VOID_PEEK_MS = 2600;
const noSubscribe = () => () => {};

// Pause menu A/B test: ?nav=slash|cutin|ribbon picks a motion (remembered), ?ab (or a
// NEXT_PUBLIC_SHOW_AB=1 review build) shows the switcher
function readMotion(): PauseMotion {
  const isMotion = (v: string | null): v is PauseMotion => MOTIONS.some((m) => m.id === v);
  const fromUrl = new URLSearchParams(window.location.search).get("nav");
  if (isMotion(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(MOTION_KEY);
    if (isMotion(saved)) return saved;
  } catch {}
  return "slash";
}
function readEmblem(): EmblemKind {
  const fromUrl = new URLSearchParams(window.location.search).get("emblem");
  if (fromUrl === "flat" || fromUrl === "3d") return fromUrl;
  try {
    const saved = localStorage.getItem(EMBLEM_KEY);
    if (saved === "flat" || saved === "3d") return saved;
  } catch {}
  return "flat";
}
const readShowAB = () =>
  process.env.NEXT_PUBLIC_SHOW_AB === "1" || new URLSearchParams(window.location.search).has("ab");

function Logo() {
  return (
    <svg
      viewBox="0 0 554.72 555"
      className="console-logo"
      onClick={() => window.dispatchEvent(new CustomEvent("primordialrune:logo-clicked"))}
      aria-label="Logo easter egg"
    >
      <path
        fill="var(--peacock-blue)"
        d="M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z"
      />
      <path
        fill="var(--blood-orange)"
        d="M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z"
      />
    </svg>
  );
}

export default function Home() {
  // null in the static HTML (dark tube) until session storage can be read
  const poweredEarlier = useSyncExternalStore(noSubscribe, readPowered, () => null);
  const [poweredNow, setPoweredNow] = useState(false);
  const powered = poweredEarlier === null ? null : poweredEarlier || poweredNow;
  const [activeCategory, setActiveCategory] = useState<string>("hero");
  const [voidPeek, setVoidPeek] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDiscoverMode, setIsDiscoverMode] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [motionPick, setMotionPick] = useState<PauseMotion | null>(null);
  const pauseMotion = useSyncExternalStore(noSubscribe, readMotion, () => "slash" as PauseMotion);
  const navMotion = motionPick ?? pauseMotion;
  const showAB = useSyncExternalStore(noSubscribe, readShowAB, () => false);
  const [emblemPick, setEmblemPick] = useState<EmblemKind | null>(null);
  const savedEmblem = useSyncExternalStore(noSubscribe, readEmblem, () => "flat" as EmblemKind);
  const emblem = emblemPick ?? savedEmblem;
  const [backend, setBackend] = useState<EmblemBackend | null>(null);
  const [speed, setSpeed] = useState(1);
  useGamepadKeys();

  useEffect(() => {
    getAllProjects().then(setAllProjects);
  }, []);

  useEffect(() => {
    if (activeCategory === "hero") return;
    getProjectsByCategory(activeCategory).then(setProjects);
  }, [activeCategory]);

  const pickMotion = (id: PauseMotion) => {
    setMotionPick(id);
    try {
      localStorage.setItem(MOTION_KEY, id);
    } catch {}
  };

  const pickEmblem = (id: EmblemKind) => {
    setEmblemPick(id);
    setBackend(null);
    try {
      localStorage.setItem(EMBLEM_KEY, id);
    } catch {}
  };

  // Review only: slow every GSAP animation down to judge the motion
  const pickSpeed = (s: number) => {
    setSpeed(s);
    gsap.globalTimeline.timeScale(s);
  };

  const powerOn = useCallback(() => {
    writePowered();
    setPoweredNow(true);
    triggerBurst({ strength: 1.5, osd: "CH 01" });
  }, []);

  // Switching section is changing channel: a short tape burst with the channel number
  const goTo = useCallback(
    (id: string) => {
      if (!powered) {
        writePowered();
        setPoweredNow(true);
      }
      if (id === activeCategory) return;
      triggerBurst({ osd: `CH ${getSection(id).number}` });
      setActiveCategory(id);
      if (id !== "hero") writeSave({ lastSection: id });
    },
    [powered, activeCategory]
  );

  const step = useCallback(
    (delta: number) => {
      const index = sections.findIndex((s) => s.id === activeCategory);
      goTo(sections[(index + delta + sections.length) % sections.length].id);
    },
    [activeCategory, goTo]
  );

  // Section shortcuts: 1-5, PageUp/PageDown (gamepad LB/RB), Home (gamepad Start)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || selectedProject || !powered || e.metaKey || e.ctrlKey || e.altKey) return;
      const digit = Number(e.key);
      if (digit >= 1 && digit <= sections.length) goTo(sections[digit - 1].id);
      else if (e.key === "PageDown") step(1);
      else if (e.key === "PageUp") step(-1);
      else if (e.key === "Home") goTo("hero");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProject, powered, goTo, step]);

  // Play time on the save file counts while the page is visible
  useEffect(() => {
    if (!powered) return;
    const id = setInterval(() => {
      if (!document.hidden) addPlayTime(PLAY_TICK_SECONDS);
    }, PLAY_TICK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [powered]);

  // The corrupted file is a glimpse of the ending: the whole portfolio, gone
  const peekVoid = useCallback(() => {
    setVoidPeek(true);
    setTimeout(() => {
      setVoidPeek(false);
      triggerBurst({ strength: 2 });
    }, VOID_PEEK_MS);
  }, []);

  const handleProjectClick = (project: Project) => {
    setIsDiscoverMode(false);
    setSelectedProject(project);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsDiscoverMode(false);
  };

  const handleDiscoverAnimationStart = useCallback(() => {
    triggerBurst({ osd: "CH ??" });
    window.dispatchEvent(new CustomEvent("primordialrune:discover-triggered"));
  }, []);

  const handleDiscover = useCallback(() => {
    if (allProjects.length === 0) return;
    if (!powered) {
      writePowered();
      setPoweredNow(true);
    }
    const randomProject = allProjects[Math.floor(Math.random() * allProjects.length)];
    setIsDiscoverMode(true);
    setSelectedProject(randomProject);
  }, [allProjects, powered]);

  const renderScreen = () => {
    if (powered === null) return null;
    if (!powered) return <PowerOn onPowered={powerOn} />;
    if (voidPeek) return <div className="void-screen" />;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="screen-section"
          data-section={activeCategory}
        >
          {activeCategory === "hero" && (
            <TitleScreen
              emblem={emblem}
              onContinue={goTo}
              onNewGame={() => goTo("systems")}
              onCorrupt={peekVoid}
              onBackend={setBackend}
            />
          )}
          {activeCategory === "archives" && (
            <ProjectGrid projects={projects} onProjectClick={handleProjectClick} />
          )}
          {(activeCategory === "systems" ||
            activeCategory === "worlds" ||
            activeCategory === "interfaces") && (
            <FloatingProjects projects={projects} onProjectClick={handleProjectClick} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div
      className="console"
      data-void={voidPeek}
      data-powered={Boolean(powered)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="nes-stripe nes-stripe-top" />

      <header className="console-header">
        <div className="console-brand">
          <Logo />
          <span
            className="console-name"
            onClick={() => window.dispatchEvent(new CustomEvent("primordialrune:nickname-clicked"))}
          >
            <span className="console-name-a">PRIMORDIAL</span>
            <span className="console-name-b">RUNE</span>
          </span>
        </div>
        <div className="console-actions">
          <DiscoverButton onDiscover={handleDiscover} onAnimationStart={handleDiscoverAnimationStart} />
        </div>
      </header>

      {/* The TV: a slim black frame, a sloped mask, then the tube */}
      <main className="console-screen">
        <div className="tv-recess">
        <CRTScreen>
          {powered && !voidPeek && (
            <PauseMenu
              key={navMotion}
              activeId={activeCategory}
              motion={navMotion}
              disabled={Boolean(selectedProject)}
              onOpenChange={setNavOpen}
              onCategoryChange={goTo}
            />
          )}
          {/* The pause menu overlays the screen; the picture underneath pauses */}
          <div className="screen-shift" data-paused={navOpen}>
            {renderScreen()}
          </div>
          {powered && !voidPeek && (
            <div className="screen-signature" aria-hidden="true">
              原初のルーン
            </div>
          )}
        </CRTScreen>
        </div>
      </main>

      <div className="nes-stripe nes-stripe-bottom" />

      {showAB && powered && (
        <details className="ab-switch" open={!window.matchMedia("(max-width: 700px), (max-height: 500px)").matches}>
          <summary>REVIEW</summary>
          <div role="group" aria-label="Pause menu motion">
            <span>NAV</span>
            {MOTIONS.map((m) => (
              <button key={m.id} aria-pressed={navMotion === m.id} onClick={() => pickMotion(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Title emblem">
            <span>EMBLEM</span>
            {EMBLEMS.map((m) => (
              <button key={m.id} aria-pressed={emblem === m.id} onClick={() => pickEmblem(m.id)}>
                {m.label}
              </button>
            ))}
            {emblem === "3d" && backend && <em>{backend === "none" ? "NO GPU" : backend.toUpperCase()}</em>}
          </div>
          <div role="group" aria-label="Animation speed">
            <span>SPEED</span>
            {SPEEDS.map((s) => (
              <button key={s} aria-pressed={speed === s} onClick={() => pickSpeed(s)}>
                {s === 1 ? "1×" : `${s}×`}
              </button>
            ))}
          </div>
        </details>
      )}

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            key={selectedProject.slug}
            project={selectedProject}
            onClose={closeModal}
            isDiscoverMode={isDiscoverMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
