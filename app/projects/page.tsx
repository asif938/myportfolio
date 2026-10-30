import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar showExperience={experience.length > 0} />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 pt-28 outline-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> Back to Portfolio
          </Link>
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">All Projects</h1>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
          </div>
          {cards.length > 0 ? (
            <ProjectsExplorer projects={cards} />
          ) : (
            <p className="text-center text-gray-500">No projects yet.</p>
          )}
        </div>
      </main>
      <Footer profile={profile} />
      <FloatingActions />
    </div>
  );
}
