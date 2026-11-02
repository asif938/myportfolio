import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Highlight from "@/components/ui/Highlight";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/chat/FloatingActions";
import ProjectsExplorer from "@/components/ProjectsExplorer";
import { getExperience, getProfile, getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "All projects, filterable by technology.",
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title: "Projects" },
};

export default async function ProjectsPage() {
  const [projects, profile, experience] = await Promise.all([
    getProjects(),
    getProfile(),
    getExperience(),
  ]);

  const cards = projects.map(({ id, slug, name, imageUrl, description, mainTechStack }) => ({
    id,
    slug,
    name,
    imageUrl,
    description,
    mainTechStack,
  }));

  return (
    <div className="flex min-h-screen flex-col text-fg">
      <Navbar name={profile?.name} showExperience={experience.length > 0} />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex-1 overflow-hidden pb-24 pt-28 outline-none sm:pt-32"
      >
        <Atmosphere variant="soft" side="left" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-fg backdrop-blur-md transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand"
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> Back to Portfolio
          </Link>
          <div className="mb-12 text-center sm:mb-14">
            <p className="cursor mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Projects
            </p>
            <h1 className="text-h2 font-bold">
              All <Highlight>Projects</Highlight>
            </h1>
          </div>
          {cards.length > 0 ? (
            <ProjectsExplorer projects={cards} />
          ) : (
            <p className="text-center text-muted">No projects yet.</p>
          )}
        </div>
      </main>
      <Footer profile={profile} />
      <FloatingActions />
    </div>
  );
}
