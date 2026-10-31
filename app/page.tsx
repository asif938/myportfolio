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
    <div className="text-fg">
      {person && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(person) }} />
      )}
      <Navbar name={profile?.name} showExperience={experience.length > 0} />
      <main id="main-content" tabIndex={-1} className="outline-none">
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
