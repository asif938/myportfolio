import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Code2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const revalidate = 60;

export default async function ProjectDetails({ params }: { params: { id: string } }) {
  const [project, profile] = await Promise.all([
    prisma.project.findUnique({ where: { id: params.id } }),
    prisma.profile.findFirst(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />

      <main className="flex-1 pb-16 pt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/#projects"
            className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Portfolio
          </Link>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {project.name}
          </h1>

          <div className="mb-8 flex flex-wrap gap-2">
            {project.mainTechStack.map((tech, i) => (
              <span
                key={i}
                className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="relative mb-12 h-[300px] w-full overflow-hidden rounded-2xl bg-gray-200 shadow-2xl sm:h-[450px] dark:bg-gray-800">
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
                <Code2 size={64} className="text-gray-400 opacity-20" />
              </div>
            )}
          </div>

          <div className="mb-12 flex flex-wrap gap-4">
            {project.liveLink && (
              <a
                href={project.liveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                <ExternalLink size={18} /> View Live Project
              </a>
            )}
            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <Github size={18} /> GitHub Repository
              </a>
            )}
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="mb-4 border-b pb-2 text-2xl font-bold dark:border-gray-800">
                About this Project
              </h2>
              <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700 dark:prose-invert dark:text-gray-300">
                {project.description}
              </div>
            </section>

            <section>
              <h2 className="mb-4 border-b pb-2 text-2xl font-bold dark:border-gray-800">
                Challenges Faced
              </h2>
              <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700 dark:prose-invert dark:text-gray-300">
                {project.challenges}
              </div>
            </section>

            <section>
              <h2 className="mb-4 border-b pb-2 text-2xl font-bold dark:border-gray-800">
                Future Plans & Improvements
              </h2>
              <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700 dark:prose-invert dark:text-gray-300">
                {project.futurePlans}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
