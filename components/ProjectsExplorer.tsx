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
    `rounded-full border px-4 py-2 text-sm font-medium transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 ${
      active
        ? "border-transparent bg-highlight text-highlight-fg"
        : "border-line-strong bg-surface text-fg backdrop-blur-md hover:border-brand"
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
        {visible.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            headingLevel="h2"
            priority={index === 0}
            tint={index}
          />
        ))}
      </div>
    </div>
  );
}
