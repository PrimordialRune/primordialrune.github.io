import type { MetadataRoute } from "next";
import { getAllProjects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getAllProjects();

  return [
    { url: `${SITE_URL}/` },
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
    })),
  ];
}
