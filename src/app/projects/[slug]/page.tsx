import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import MDX files
const PuzzlePlatformer = dynamic(
  () => import("@/../content/projects/puzzle-platformer.mdx")
);
const TacticalCardGame = dynamic(
  () => import("@/../content/projects/tactical-card-game.mdx")
);
const RPGInventorySystem = dynamic(
  () => import("@/../content/projects/rpg-inventory-system.mdx")
);
const MenuSystemDesign = dynamic(
  () => import("@/../content/projects/menu-system-design.mdx")
);
const LevelSelectorUI = dynamic(
  () => import("@/../content/projects/level-selector-ui.mdx")
);
const DialogueSystemUI = dynamic(
  () => import("@/../content/projects/dialogue-system-ui.mdx")
);
const ResultsScreenDesign = dynamic(
  () => import("@/../content/projects/results-screen-design.mdx")
);
const PauseMenuDesign = dynamic(
  () => import("@/../content/projects/pause-menu-design.mdx")
);

const mdxComponents: Record<string, React.ComponentType> = {
  "puzzle-platformer": PuzzlePlatformer,
  "tactical-card-game": TacticalCardGame,
  "rpg-inventory-system": RPGInventorySystem,
  "menu-system-design": MenuSystemDesign,
  "level-selector-ui": LevelSelectorUI,
  "dialogue-system-ui": DialogueSystemUI,
  "results-screen-design": ResultsScreenDesign,
  "pause-menu-design": PauseMenuDesign,
};

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const project = await getProjectBySlug(resolvedParams.slug);

  if (!project) {
    notFound();
  }

  const MDXContent = mdxComponents[project.slug];

  if (!MDXContent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b-2 border-peacock-blue/10">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-blood-orange text-blood-orange hover:bg-blood-orange hover:text-cream rounded-lg font-black transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
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
              <path d="M13 16l-6-6 6-6" />
            </svg>
            BACK TO PORTFOLIO
          </Link>

          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 bg-blood-orange rounded-lg text-cream text-sm font-black"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              {project.year}
            </span>
            <span className="text-sm text-peacock-blue/60">{project.role}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable Document */}
      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Project Header */}
        <div className="mb-12">
          <h1
            className="text-6xl font-black text-peacock-blue mb-4 leading-tight"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            {project.title}
          </h1>
          {project.titleJp && (
            <p
              className="text-2xl text-aquamarine/70 mb-6 tracking-wider"
              style={{ fontFamily: "var(--font-8bit-darling)" }}
            >
              {project.titleJp}
            </p>
          )}
          <p className="text-xl text-peacock-blue/70 leading-relaxed max-w-3xl">
            {project.shortDescription}
          </p>
        </div>

        {/* Featured Image */}
        {project.thumbnail && (
          <div className="mb-12 rounded-2xl overflow-hidden border-4 border-peacock-blue/20">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* MDX Content - GDD Style */}
        <article
          className="prose prose-lg max-w-none
            prose-headings:font-black prose-headings:text-peacock-blue
            prose-h1:text-5xl prose-h1:mb-6 prose-h1:mt-12
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10 prose-h2:text-blood-orange
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-aquamarine
            prose-p:text-peacock-blue/80 prose-p:leading-relaxed
            prose-a:text-blood-orange prose-a:no-underline hover:prose-a:underline
            prose-strong:text-peacock-blue prose-strong:font-black
            prose-ul:text-peacock-blue/80 prose-ol:text-peacock-blue/80
            prose-li:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-blood-orange
            prose-blockquote:bg-blood-orange/5 prose-blockquote:py-2 prose-blockquote:px-6
            prose-blockquote:italic prose-blockquote:text-peacock-blue/70
            prose-code:text-blood-orange prose-code:bg-peacock-blue/5
            prose-code:px-2 prose-code:py-1 prose-code:rounded
            prose-img:rounded-xl prose-img:border-2 prose-img:border-peacock-blue/20
          "
        >
          <MDXContent />
        </article>

        {/* Image Gallery */}
        {project.images.length > 1 && (
          <div className="mt-16">
            <h2
              className="text-3xl font-black text-blood-orange mb-6"
              style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
            >
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.images.map((img, index) => (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden border-2 border-peacock-blue/20 hover:border-aquamarine transition-all"
                >
                  <img src={img} alt={`${project.title} screenshot ${index + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools Used */}
        <div className="mt-16 p-8 bg-peacock-blue/5 rounded-2xl border-2 border-peacock-blue/10">
          <h3
            className="text-xl font-black text-peacock-blue mb-4"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
          >
            TOOLS & TECHNOLOGIES
          </h3>
          <div className="flex flex-wrap gap-3">
            {project.tools.map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 bg-cream border-2 border-peacock-blue/20 rounded-lg text-peacock-blue font-black"
                style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Back to top */}
        <div className="mt-16 pt-8 border-t-2 border-peacock-blue/10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blood-orange hover:bg-blood-orange/80 rounded-xl text-cream font-black transition-all"
            style={{ fontFamily: "var(--font-fk-grotesk-black)" }}
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
              <path d="M13 16l-6-6 6-6" />
            </svg>
            BACK TO PORTFOLIO
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t-2 border-peacock-blue/10">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <p
            className="text-2xl text-aquamarine/40 tracking-wider"
            style={{ fontFamily: "var(--font-8bit-darling)" }}
          >
            原初のルーン
          </p>
          <p className="text-sm text-peacock-blue/40 mt-2">
            © 2024 Omar Golinelli (PrimordialRune)
          </p>
        </div>
      </footer>
    </div>
  );
}
