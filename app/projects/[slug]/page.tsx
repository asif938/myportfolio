import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Code2, ExternalLink, Github } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ProjectGallery from "@/components/ProjectGallery";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-b pb-2 text-2xl font-bold dark:border-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700 dark:prose-invert dark:text-gray-300">
      {text}
    </div>
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
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <Navbar showExperience={experience.length > 0} />

      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 pt-24 outline-none">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/projects"
            className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> All Projects
          </Link>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {project.name}
          </h1>

          <ul className="mb-8 flex flex-wrap gap-2" aria-label="Technologies">
            {project.mainTechStack.map((tech, i) => (
              <li
                key={`${tech}-${i}`}
                className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                {tech}
              </li>
            ))}
          </ul>

          <div className="relative mb-12 h-[300px] w-full overflow-hidden rounded-2xl bg-gray-200 shadow-2xl dark:bg-gray-800 sm:h-[450px]">
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
              <div className="flex h-full w-full items-center justify-center">
                <Code2 size={64} className="text-gray-400 opacity-20" aria-hidden="true" />
              </div>
            )}
          </div>

          {(project.liveLink || project.githubLink) && (
            <div className="mb-12 flex flex-wrap gap-4">
              {project.liveLink && (
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
                >
                  <ExternalLink size={18} aria-hidden="true" /> View Live Project
                </a>
              )}
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <Github size={18} aria-hidden="true" /> GitHub Repository
                </a>
              )}
            </div>
          )}

          <div className="space-y-12">
            {textSections.filter(hasText).map((s) => (
              <Section key={s.title} title={s.title}>
                <Prose text={s.text} />
              </Section>
            ))}

            {project.images.length > 0 && (
              <Section title="Gallery">
                <ProjectGallery images={project.images} title={project.name} />
              </Section>
            )}

            {closingSections.filter(hasText).map((s) => (
              <Section key={s.title} title={s.title}>
                <Prose text={s.text} />
              </Section>
            ))}
          </div>
        </div>
      </main>

      <Footer profile={profile} />
      <BackToTop />
    </div>
  );
}
