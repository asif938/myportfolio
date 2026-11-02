import type { Project } from "@prisma/client";
import Image from "next/image";
import { Code2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";

export type ProjectCardData = Pick<
  Project,
  "id" | "slug" | "name" | "imageUrl" | "description" | "mainTechStack"
>;

export default function ProjectCard({
  project,
  headingLevel = "h3",
  priority = false,
  tint,
}: {
  project: ProjectCardData;
  headingLevel?: "h2" | "h3";
  /** Load the cover eagerly (use for cards visible on first paint). */
  priority?: boolean;
  /** 0-based index: picks the palette tint and shows the 01/02/03 numeral. Omit for a neutral card. */
  tint?: number;
}) {
  const Heading = headingLevel;
  return (
    <article className="flex h-full w-full">
      <Card tint={tint} gradientBorder className="group flex w-full flex-col p-4 sm:p-5">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-surface-2">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={project.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 380px, (min-width: 768px) 46vw, 92vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted">
              <Code2 size={44} className="opacity-40" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
          <div className="mb-2 flex items-center gap-3">
            {tint !== undefined && (
              <span className="font-display text-sm font-bold tabular-nums" aria-hidden="true">
                {String(tint + 1).padStart(2, "0")}
              </span>
            )}
            <Heading className="text-xl font-bold">{project.name}</Heading>
          </div>
          <div className="mb-5 flex-1">
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">{project.description}</p>
          </div>

          <ul className="mb-6 flex flex-wrap gap-2">
            {project.mainTechStack.slice(0, 3).map((tech, i) => (
              <li key={`${tech}-${i}`}>
                <Chip className="px-3 py-1 text-xs">{tech}</Chip>
              </li>
            ))}
            {project.mainTechStack.length > 3 && (
              <li>
                <Chip className="px-3 py-1 text-xs text-muted">
                  +{project.mainTechStack.length - 3} more
                </Chip>
              </li>
            )}
          </ul>

          <Button href={`/projects/${project.slug}`} size="sm" className="self-start">
            View details<span className="sr-only">: {project.name}</span>
          </Button>
        </div>
      </Card>
    </article>
  );
}
