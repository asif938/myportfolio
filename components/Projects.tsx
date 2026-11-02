import type { Project } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

/** The contrast band: a dark panel inside the light page (tokens re-declared by `.band`). */
function BandBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--band-glow-1), transparent)" }}
      />
      <div
        className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--band-glow-2), transparent)" }}
      />
      <div className="dot-matrix absolute inset-0 opacity-50" />
    </div>
  );
}

export default function Projects({
  projects,
  totalCount,
}: {
  projects: Project[];
  totalCount: number;
}) {
  if (projects.length === 0) return null;

  return (
    <Section id="projects" className="band" backdrop={<BandBackdrop />}>
      <Reveal>
        <SectionHeading eyebrow="Projects" title="Featured Projects" highlight="Projects" />
      </Reveal>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {projects.map((project, index) => (
          <Reveal as="li" key={project.id} delay={(index % 3) * 0.08} className="flex">
            <ProjectCard project={project} tint={index} />
          </Reveal>
        ))}
      </ul>

      {totalCount > projects.length && (
        <div className="mt-12 text-center">
          <Button href="/projects" variant="secondary">
            <span className="inline-flex items-center gap-2">
              View all {totalCount} projects <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Button>
        </div>
      )}
    </Section>
  );
}
