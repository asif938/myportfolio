import type { Project } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

export type ProjectCardData = Pick<
  Project,
  "id" | "slug" | "name" | "imageUrl" | "description" | "mainTechStack"
>;

export default function ProjectCard({
  project,
  headingLevel = "h3",
  priority = false,
}: {
  project: ProjectCardData;
  headingLevel?: "h2" | "h3";
  /** Load the cover eagerly (use for cards visible on first paint). */
  priority?: boolean;
}) {
  const Heading = headingLevel;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Code2 size={48} className="opacity-20" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Heading className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {project.name}
        </Heading>
        <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-600 dark:text-gray-400">
          {project.description}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {project.mainTechStack.slice(0, 3).map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {tech}
            </span>
          ))}
          {project.mainTechStack.length > 3 && (
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              +{project.mainTechStack.length - 3} more
            </span>
          )}
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          View Details<span className="sr-only">: {project.name}</span>
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="ml-1 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
