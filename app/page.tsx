import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/chat/FloatingActions";
import {
  HOME_PROJECTS_FALLBACK_COUNT,
  getEducation,
  getExperience,
  getProfile,
  getProjects,
  getSkills,
} from "@/lib/data";
import { SITE_URL, jsonLd } from "@/lib/site";

export default async function Home() {
  const [profile, skills, experience, education, projects] = await Promise.all([
    getProfile(),
    getSkills(),
    getExperience(),
    getEducation(),
    getProjects(),
  ]);

  const featured = projects.filter((p) => p.featured);
  const homeProjects =
    featured.length > 0 ? featured : projects.slice(0, HOME_PROJECTS_FALLBACK_COUNT);

  const currentJob = experience.find((e) => e.endDate === null);
  const person = profile && {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.designation,
    description: profile.tagline ?? undefined,
    url: SITE_URL,
    image: profile.heroPhotoUrl ?? undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    address: profile.location
      ? { "@type": "PostalAddress", addressLocality: profile.location }
      : undefined,
    worksFor: currentJob ? { "@type": "Organization", name: currentJob.company } : undefined,
    knowsAbout: skills.map((s) => s.name),
    sameAs: [profile.githubUrl, profile.linkedinUrl, profile.facebookUrl].filter(
      (url): url is string => Boolean(url),
    ),
  };

  return (
    <div className="bg-gray-50 text-gray-900 selection:bg-indigo-500 selection:text-white dark:bg-gray-950 dark:text-gray-100">
      {person && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(person) }} />
      )}
      <Navbar showExperience={experience.length > 0} />
      {/* Sections alternate background colours no matter which ones are hidden. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none [&>section:nth-of-type(even)]:bg-white dark:[&>section:nth-of-type(even)]:bg-gray-900 [&>section:nth-of-type(odd)]:bg-gray-50 dark:[&>section:nth-of-type(odd)]:bg-gray-950"
      >
        <Hero profile={profile} />
        <About profile={profile} />
        <Skills skills={skills} />
        <Experience experience={experience} />
        <Education education={education} />
        <Projects projects={homeProjects} totalCount={projects.length} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
      <FloatingActions />
    </div>
  );
}
