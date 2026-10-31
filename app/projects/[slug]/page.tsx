import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Code2, ExternalLink, Github } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/chat/FloatingActions";
import ProjectGallery from "@/components/ProjectGallery";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { tintClass } from "@/components/ui/Card";
import type { Metadata } from "next";
import {
  getExperience,
  getProfile,
  getProjectBySlug,
  getProjectSlugById,
  getProjects,
} from "@/lib/data";
import { SITE_URL, absoluteUrl, jsonLd, truncate } from "@/lib/site";

type Params = { params: { slug: string } };

/** Pre-render every project page at build time; new projects render on first request. */
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};

  const path = `/projects/${project.slug}`;
  const description = truncate(project.description);
  // The Open Graph image comes from ./opengraph-image.tsx (it includes the cover image).
  return {
    title: project.name,
    description,
    keywords: project.mainTechStack,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: project.name, description },
    twitter: { card: "summary_large_image", title: project.name, description },
  };
}

function Block({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-4 border-b border-line pb-4 text-2xl font-bold">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient-deep text-xs font-bold text-white"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="max-w-[65ch] whitespace-pre-line text-base leading-[1.75] text-muted sm:text-lg">{text}</div>
  );
}

export default async function ProjectDetails({ params }: Params) {
  const [project, profile, experience] = await Promise.all([
    getProjectBySlug(params.slug),
    getProfile(),
    getExperience(),
  ]);

  if (!project) {
    // Old links used the project id: /projects/<id> -> /projects/<slug> (308).
    const byId = await getProjectSlugById(params.slug);
    if (byId) permanentRedirect(`/projects/${byId.slug}`);
    notFound();
  }

  const textSections = [
    { title: "About this Project", text: project.description },
    { title: "My Role", text: project.role },
    { title: "Architecture", text: project.architecture },
    { title: "Impact", text: project.impact },
  ];
  const closingSections = [
    { title: "Challenges Faced", text: project.challenges },
    { title: "Future Plans & Improvements", text: project.futurePlans },
  ];
  const hasText = (s: { text: string | null }): s is { title: string; text: string } =>
    Boolean(s.text?.trim());

  // Numbered blocks in display order: text sections, optional gallery, closing sections.
  const blocks: { title: string; node: React.ReactNode }[] = [
    ...textSections.filter(hasText).map((s) => ({ title: s.title, node: <Prose text={s.text} /> })),
    ...(project.images.length > 0
      ? [{ title: "Gallery", node: <ProjectGallery images={project.images} title={project.name} /> }]
      : []),
    ...closingSections.filter(hasText).map((s) => ({ title: s.title, node: <Prose text={s.text} /> })),
  ];

  const url = absoluteUrl(`/projects/${project.slug}`);
  const author = profile ? { "@type": "Person", name: profile.name, url: SITE_URL } : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": project.githubLink ? "SoftwareSourceCode" : "CreativeWork",
    name: project.name,
    description: project.description,
    url,
    image: [project.imageUrl, ...project.images].filter(Boolean),
    keywords: project.mainTechStack.join(", "),
    author,
    creator: author,
    dateCreated: project.createdAt.toISOString(),
    dateModified: project.updatedAt.toISOString(),
    ...(project.githubLink
      ? {
          codeRepository: project.githubLink,
          programmingLanguage: project.mainTechStack,
        }
      : {}),
    ...(project.liveLink ? { sameAs: project.liveLink } : {}),
  };

  return (
    <div className="flex min-h-screen flex-col text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <Navbar name={profile?.name} showExperience={experience.length > 0} />

      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex-1 overflow-hidden pb-20 pt-28 outline-none sm:pt-32"
      >
        <Atmosphere variant="soft" side="right" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/projects"
            className="mb-8 inline-flex items-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-fg backdrop-blur-md transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand"
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> All Projects
          </Link>

          <p className="cursor mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Project</p>
          <h1 className="mb-6 text-[clamp(2.2rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.02em]">
            {project.name}
          </h1>

          <ul className="mb-10 flex flex-wrap gap-2" aria-label="Technologies">
            {project.mainTechStack.map((tech, i) => (
              <li key={`${tech}-${i}`}>
                <Chip tinted className={tintClass(i)}>
                  {tech}
                </Chip>
              </li>
            ))}
          </ul>

          <div className="relative mb-10 rounded-[2rem] bg-brand-gradient p-1 shadow-glow">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] bg-surface-2 sm:aspect-[16/9]">
              {project.imageUrl ? (
                <Image
                  src={project.imageUrl}
                  alt={project.name}
                  fill
                  sizes="(min-width: 896px) 896px, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted">
                  <Code2 size={64} className="opacity-40" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {(project.liveLink || project.githubLink) && (
            <div className="mb-14 flex flex-wrap gap-3 sm:gap-4">
              {project.liveLink && (
                <Button href={project.liveLink} external chipIcon={ExternalLink}>
                  View Live Project
                </Button>
              )}
              {project.githubLink && (
                <Button href={project.githubLink} external variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    <Github size={18} aria-hidden="true" /> GitHub Repository
                  </span>
                </Button>
              )}
            </div>
          )}

          <div className="space-y-12">
            {blocks.map((b, i) => (
              <Block key={b.title} index={i} title={b.title}>
                {b.node}
              </Block>
            ))}
          </div>
        </div>
      </main>

      <Footer profile={profile} />
      <FloatingActions />
    </div>
  );
}
