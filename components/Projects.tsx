import type { Project } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";

export default function Projects({
  projects,
  totalCount,
}: {
  projects: Project[];
  totalCount: number;
}) {
  if (projects.length === 0) return null;

  return (
    <section
      id="projects"
      tabIndex={-1}
      className="scroll-mt-16 bg-gray-50 py-24 outline-none dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Featured Projects
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.id} delay={(index % 3) * 0.08} className="h-full">
              <ProjectCard project={project} />
            </Reveal>
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
