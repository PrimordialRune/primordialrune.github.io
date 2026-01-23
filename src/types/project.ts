export interface Project {
  slug: string;
  title: string;
  titleJp?: string; // Optional Japanese title
  shortDescription: string;
  year: string;
  role: string;
  tools: string[];
  category: "hero" | "systems" | "worlds" | "interfaces" | "archives";
  images: string[]; // Array of image paths in public/
  abstract: string; // Longer detailed description
  featured?: boolean; // For hero section
  thumbnail?: string; // Main thumbnail, defaults to first image
}

export interface ProjectMetadata {
  slug: string;
  title: string;
  titleJp?: string;
  shortDescription: string;
  year: string;
  role: string;
  tools: string;
  category: "hero" | "systems" | "worlds" | "interfaces" | "archives";
  images: string;
  abstract: string;
  featured?: string;
  thumbnail?: string;
}
