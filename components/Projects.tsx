import type { Project } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

export default function Projects({
  projects,
  totalCount,
}: {
  projects: Project[];
  totalCount: number;
}) {
  if (projects.length === 0) return null;

  return (
    <section id="projects" className="bg-gray-50 py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Featured Projects
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {totalCount > projects.length && (
          <div className="mt-12 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-8 py-3.5 text-sm font-semibold text-gray-900 transition-all hover:-translate-y-1 hover:border-gray-300 dark:border-gray-800 dark:text-white dark:hover:border-gray-700"
            >
              View all {totalCount} projects <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
