"use client";

import { useMemo, useState } from "react";
import ProjectCard, { type ProjectCardData } from "@/components/ProjectCard";

const normalize = (tech: string) => tech.trim().toLowerCase();

export default function ProjectsExplorer({ projects }: { projects: ProjectCardData[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  // Every technology used, most common first. Spelling variants ("react", "React") are merged.
  const technologies = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const project of projects) {
      for (const tech of Array.from(new Set(project.mainTechStack.map(normalize)))) {
        const label = project.mainTechStack.find((t) => normalize(t) === tech) ?? tech;
        const entry = counts.get(tech);
        counts.set(tech, { label: entry?.label ?? label, count: (entry?.count ?? 0) + 1 });
      }
    }
    return Array.from(counts, ([key, value]) => ({ key, ...value })).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [projects]);

  const visible = selected
    ? projects.filter((p) => p.mainTechStack.some((t) => normalize(t) === selected))
    : projects;

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      active
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
    }`;

  return (
    <div>
      {technologies.length > 1 && (
        <div
          role="group"
          aria-label="Filter by technology"
          className="mb-10 flex flex-wrap justify-center gap-2"
        >
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => setSelected(null)}
            className={chipClass(selected === null)}
          >
            All ({projects.length})
          </button>
          {technologies.map((tech) => (
            <button
              key={tech.key}
              type="button"
              aria-pressed={selected === tech.key}
              onClick={() => setSelected(selected === tech.key ? null : tech.key)}
              className={chipClass(selected === tech.key)}
            >
              {tech.label} ({tech.count})
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {projects.length} projects
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} headingLevel="h2" />
        ))}
      </div>
    </div>
  );
}
