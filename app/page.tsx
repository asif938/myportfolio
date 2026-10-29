import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getEducation, getExperience, getHomeProjects, getProfile, getSkills } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // Revalidate every minute or use webhook

export default async function Home() {
  const [profile, skills, experience, education, projects, projectCount] = await Promise.all([
    getProfile(),
    getSkills(),
    getExperience(),
    getEducation(),
    getHomeProjects(),
    prisma.project.count(),
  ]);

  return (
    <div className="bg-gray-50 text-gray-900 selection:bg-indigo-500 selection:text-white dark:bg-gray-950 dark:text-gray-100">
      <Navbar showExperience={experience.length > 0} />
      {/* Sections alternate background colours no matter which ones are hidden. */}
      <main className="[&>section:nth-of-type(even)]:bg-white dark:[&>section:nth-of-type(even)]:bg-gray-900 [&>section:nth-of-type(odd)]:bg-gray-50 dark:[&>section:nth-of-type(odd)]:bg-gray-950">
        <Hero profile={profile} />
        <About profile={profile} />
        <Skills skills={skills} />
        <Experience experience={experience} />
        <Education education={education} />
        <Projects projects={projects} totalCount={projectCount} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </div>
  );
}
