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
    importance: metadata.importance ? parseInt(metadata.importance, 10) : 3, // Default to 3 (medium)
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
      importance: "5",
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
      importance: "4",
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
    // ARCHIVES - Game jams, experiments, prototypes
    {
      slug: "ludum-dare-52",
      title: "Harvest Rush",
      titleJp: "ハーベストラッシュ",
      shortDescription:
        "A 48-hour game jam entry for Ludum Dare 52 with the theme 'Harvest'",
      year: "2023",
      role: "Game Designer, Developer",
      tools: "Unity, C#, Aseprite",
      category: "archives",
      images: "/resources/title.png",
      abstract:
        "A fast-paced farming game created in 48 hours for Ludum Dare 52. Players must harvest crops before time runs out while managing limited inventory space. Features procedural level generation and a scoring system.",
      featured: "false",
      thumbnail: "/resources/title.png",
      importance: "2",
    },
    {
      slug: "procedural-dungeon",
      title: "Procedural Dungeon",
      titleJp: "手続き型ダンジョン",
      shortDescription:
        "An experimental dungeon generator using wave function collapse",
      year: "2022",
      role: "Technical Artist, Developer",
      tools: "Unity, C#, Python",
      category: "archives",
      images: "/resources/cover.gif",
      abstract:
        "A technical experiment exploring procedural generation using the wave function collapse algorithm. Creates interconnected dungeon rooms with guaranteed connectivity and themed room placement.",
      featured: "false",
      thumbnail: "/resources/cover.gif",
      importance: "2",
    },
    {
      slug: "pixel-shader-experiments",
      title: "Pixel Shader Lab",
      titleJp: "シェーダー実験",
      shortDescription:
        "A collection of retro-style pixel shaders and post-processing effects",
      year: "2023",
      role: "Technical Artist",
      tools: "Unity, HLSL, ShaderGraph",
      category: "archives",
      images: "/resources/lbe__U.jpg",
      abstract:
        "A technical sandbox exploring CRT effects, dithering patterns, color quantization, and retro visual styles. Includes implementations of scanlines, chromatic aberration, and color palette limitations.",
      featured: "false",
      thumbnail: "/resources/lbe__U.jpg",
      importance: "2",
    },
    {
      slug: "gmtk-2023",
      title: "Roles Reversed",
      titleJp: "逆転ロール",
      shortDescription:
        "GMTK Game Jam 2023 entry - play as the final boss defending against heroes",
      year: "2023",
      role: "Game Designer, Developer",
      tools: "Godot, GDScript, Aseprite",
      category: "archives",
      images: "/resources/start_menu.png",
      abstract:
        "A role-reversal tower defense game where you play as the final boss setting up traps and minions to stop incoming heroes. Created in 48 hours for GMTK Game Jam 2023 with the theme 'Roles Reversed'.",
      featured: "false",
      thumbnail: "/resources/start_menu.png",
      importance: "2",
    },
    {
      slug: "ai-pathfinding-demo",
      title: "Pathfinding Visualizer",
      titleJp: "経路探索可視化",
      shortDescription:
        "Interactive visualizer for A*, Dijkstra, and other pathfinding algorithms",
      year: "2022",
      role: "Developer",
      tools: "JavaScript, Canvas API, React",
      category: "archives",
      images: "/resources/level selectorv2.png",
      abstract:
        "An educational tool for visualizing pathfinding algorithms in real-time. Supports A*, Dijkstra, BFS, and DFS with customizable heuristics and obstacle placement.",
      featured: "false",
      thumbnail: "/resources/level selectorv2.png",
      importance: "2",
    },
    {
      slug: "vr-prototype",
      title: "VR Escape Room",
      titleJp: "VR脱出ゲーム",
      shortDescription:
        "A prototype VR escape room with physics-based puzzles",
      year: "2022",
      role: "Game Designer, Developer",
      tools: "Unity, XR Toolkit, C#",
      category: "archives",
      images: "/resources/PAUSE6.png",
      abstract:
        "A VR escape room prototype featuring hand tracking, physics interactions, and multi-step puzzles. Focused on natural gesture-based interactions and environmental storytelling.",
      featured: "false",
      thumbnail: "/resources/PAUSE6.png",
      importance: "2",
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
