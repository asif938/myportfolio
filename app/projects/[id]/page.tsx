import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Code2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const revalidate = 60;

export default async function ProjectDetails({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });
  const profile = await prisma.profile.findFirst();

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/#projects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Portfolio
          </Link>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">{project.name}</h1>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {project.mainTechStack.map((tech: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-sm font-semibold rounded-lg">
                {tech}
              </span>
            ))}
          </div>

          <div className="relative w-full h-[300px] sm:h-[450px] rounded-2xl overflow-hidden shadow-2xl mb-12 bg-gray-200 dark:bg-gray-800">
            {project.imageUrl ? (
              <Image 
                src={project.imageUrl} 
                alt={project.name} 
                fill 
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Code2 size={64} className="text-gray-400 opacity-20" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-12">
            {project.liveLink && (
              <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:bg-indigo-500 transition-all">
                <ExternalLink size={18} /> View Live Project
              </a>
            )}
            {project.githubLink && (
              <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border-2 border-gray-200 dark:border-gray-700 px-6 py-3 text-sm font-semibold hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                <Github size={18} /> GitHub Repository
              </a>
            )}
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2 dark:border-gray-800">About this Project</h2>
              <div className="prose prose-lg dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {project.description}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2 dark:border-gray-800">Challenges Faced</h2>
              <div className="prose prose-lg dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {project.challenges}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2 dark:border-gray-800">Future Plans & Improvements</h2>
              <div className="prose prose-lg dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-line">
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
