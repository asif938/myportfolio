import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  const latest = projects.reduce<Date | undefined>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    undefined,
  );

  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "monthly", priority: 1 },
    {
      url: absoluteUrl("/projects"),
      lastModified: latest,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...projects.map((p) => ({
      url: absoluteUrl(`/projects/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
