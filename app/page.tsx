import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Education from "@/components/Education";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const revalidate = 60; // Revalidate every minute or use webhook

export default async function Home() {
  const profile = await prisma.profile.findFirst();
  const skills = await prisma.skill.findMany({ orderBy: { category: "asc" } });
  const education = await prisma.education.findMany({ orderBy: { startYear: "desc" } });
  const projects = await prisma.project.findMany();

  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main>
        <Hero profile={profile} />
        <About profile={profile} />
        <Skills skills={skills} />
        <Education education={education} />
        <Projects projects={projects} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </div>
  );
}
