import fs from "fs";
import path from "path";
import { Project, ProjectMetadata } from "@/types/project";

const projectsDirectory = path.join(process.cwd(), "content/projects");

function parseMetadata(metadata: ProjectMetadata): Project {
  return {
    slug: metadata.slug,
    title: metadata.title,
    titleJp: metadata.titleJp,
    shortDescription: metadata.shortDescription,
    year: metadata.year,
    role: metadata.role,
    tools: metadata.tools.split(",").map((t) => t.trim()),
    category: metadata.category,
    images: metadata.images.split(",").map((img) => img.trim()),
    abstract: metadata.abstract,
    featured: metadata.featured === "true",
    thumbnail: metadata.thumbnail,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  // For static export, we'll manually list projects
  // In a real app, you'd read the directory
  const projects: ProjectMetadata[] = [
    {
      slug: "puzzle-platformer",
      title: "Puzzle Platformer",
      titleJp: "パズルプラットフォーマー",
      shortDescription:
        "A challenging puzzle-platformer with unique mechanics and retro aesthetics",
      year: "2024",
      role: "Game Designer, UI/UX Designer",
      tools: "Unity, C#, Aseprite, Figma",
      category: "worlds",
      images:
        "/resources/title.png,/resources/start_menu.png,/resources/level selectorv2.png,/resources/PAUSE6.png,/resources/shop_page.png,/resources/upgrade_page.png,/resources/level complete.png,/resources/level failed.png,/resources/dialogue_example.png,/resources/Dialogue mockup.png",
      abstract:
        "A puzzle-platformer that combines precision movement with brain-teasing puzzles. The game features a comprehensive progression system, dialogue system, and a cohesive retro-inspired visual design. This project showcases full UI/UX design for game menus, HUD elements, and interactive systems.",
      featured: "true",
      thumbnail: "/resources/title.png",
    },
    {
      slug: "tactical-card-game",
      title: "Tactical Card Game",
      titleJp: "タクティカルカードゲーム",
      shortDescription:
        "A strategic tabletop card game combining deck-building with tactical positioning",
      year: "2023",
      role: "Game Designer, Systems Designer",
      tools: "Tabletop Simulator, Figma, Google Sheets",
      category: "systems",
      images: "/resources/cover.gif",
      abstract:
        "A tactical card game that merges deck-building mechanics with spatial positioning on a hex grid. Players must carefully manage resources, build synergistic card combinations, and outmaneuver opponents. This project explores balance design, economy systems, and emergent gameplay through simple rule sets.",
      featured: "false",
      thumbnail: "/resources/cover.gif",
    },
    {
      slug: "rpg-inventory-system",
      title: "RPG Inventory System",
      titleJp: "RPGインベントリ",
      shortDescription:
        "A comprehensive UI/UX redesign for a classic RPG inventory management system",
      year: "2024",
      role: "UI/UX Designer",
      tools: "Figma, Adobe Illustrator, Unity UI Toolkit",
      category: "interfaces",
      images: "/resources/lbe__U.jpg",
      abstract:
        "A complete redesign of inventory management for a fantasy RPG, focusing on clarity, efficiency, and player satisfaction. The system handles equipment, consumables, key items, and crafting materials while maintaining visual consistency with the game's aesthetic. Includes responsive design considerations and accessibility features.",
      featured: "false",
      thumbnail: "/resources/lbe__U.jpg",
    },
    {
      slug: "menu-system-design",
      title: "Menu System Design",
      titleJp: "メニューシステム",
      shortDescription:
        "Retro-inspired main menu with dynamic transitions and particle effects",
      year: "2024",
      role: "UI Designer",
      tools: "Figma, Unity UI Toolkit, After Effects",
      category: "interfaces",
      images: "/resources/start_menu.png,/resources/title.png",
      abstract:
        "A main menu system inspired by classic JRPGs with modern polish. Features animated title screen, parallax backgrounds, and smooth state transitions. Designed to set the tone for the entire game experience.",
      featured: "false",
      thumbnail: "/resources/start_menu.png",
    },
    {
      slug: "level-selector-ui",
      title: "Level Selector UI",
      titleJp: "レベル選択",
      shortDescription:
        "Grid-based level selection interface with progression tracking",
      year: "2023",
      role: "UI/UX Designer",
      tools: "Sketch, Principle, Unity",
      category: "interfaces",
      images: "/resources/level selectorv2.png",
      abstract:
        "A clean, intuitive level selector that clearly communicates progression, difficulty, and completion status. Features include locked/unlocked states, star ratings, and thumbnail previews.",
      featured: "false",
      thumbnail: "/resources/level selectorv2.png",
    },
    {
      slug: "dialogue-system-ui",
      title: "Dialogue System UI",
      titleJp: "対話システム",
      shortDescription:
        "Character-driven dialogue interface with branching conversation support",
      year: "2024",
      role: "UI Designer, Systems Designer",
      tools: "Figma, Unity, Yarn Spinner",
      category: "interfaces",
      images: "/resources/Dialogue mockup.png,/resources/dialogue_example.png",
      abstract:
        "A flexible dialogue system supporting character portraits, choice branching, and text animations. Designed to enhance narrative moments while remaining unobtrusive during gameplay.",
      featured: "false",
      thumbnail: "/resources/Dialogue mockup.png",
    },
    {
      slug: "results-screen-design",
      title: "Results Screen Design",
      titleJp: "結果画面",
      shortDescription:
        "Victory and defeat screens with performance feedback and progression rewards",
      year: "2023",
      role: "UI/UX Designer",
      tools: "Adobe XD, Illustrator, Unity",
      category: "interfaces",
      images: "/resources/level complete.png,/resources/level failed.png",
      abstract:
        "Designed success and failure states that provide clear feedback while maintaining player motivation. Includes star ratings, time bonuses, and collectible tracking with smooth reveal animations.",
      featured: "false",
      thumbnail: "/resources/level complete.png",
    },
    {
      slug: "pause-menu-design",
      title: "Pause Menu Design",
      titleJp: "ポーズメニュー",
      shortDescription:
        "Streamlined pause menu with quick access to game settings and options",
      year: "2024",
      role: "UI Designer",
      tools: "Figma, Unity UI Toolkit",
      category: "interfaces",
      images: "/resources/PAUSE6.png",
      abstract:
        "A pause menu that balances quick resume functionality with access to settings, inventory, and game options. Features visual clarity, keyboard/controller navigation, and context-sensitive actions.",
      featured: "false",
      thumbnail: "/resources/PAUSE6.png",
    },
  ];

  return projects.map(parseMetadata);
}

export async function getProjectsByCategory(
  category: string
): Promise<Project[]> {
  const allProjects = await getAllProjects();
  return allProjects.filter((project) => project.category === category);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const allProjects = await getAllProjects();
  return allProjects.find((project) => project.slug === slug) || null;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const allProjects = await getAllProjects();
  return allProjects.filter((project) => project.featured);
}
