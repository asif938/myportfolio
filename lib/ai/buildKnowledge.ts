import "server-only";
import { unstable_cache } from "next/cache";
import type { Education, Experience, Profile, Project, Skill } from "@prisma/client";
import { CACHE_TAGS, db } from "@/lib/data";
import { EMPLOYMENT_TYPE_LABELS, formatDateRange } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const KNOWLEDGE_TAG = "knowledge";

export type KnowledgeSources = {
  profile: Profile | null;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  siteUrl: string;
};

const line = (label: string, value: string | null | undefined) =>
  value && value.trim() ? `- **${label}:** ${value.trim()}` : null;

const link = (text: string, url: string | null | undefined) => (url ? `[${text}](${url})` : null);

const join = (parts: Array<string | null>) =>
  parts.filter((p): p is string => Boolean(p)).join("\n");

/**
 * Build the Markdown knowledge base the chatbot answers from.
 * Pure function (no database access) so it can be unit tested.
 * Only public portfolio content is included: no admin/user data, and the phone number
 * only when the owner chose to show it publicly.
 */
export function buildKnowledgeMarkdown(src: KnowledgeSources): string {
  const { profile, skills, experience, education, projects, siteUrl } = src;
  const sections: string[] = [];

  if (profile) {
    sections.push(
      join([
        `# ${profile.name}`,
        "",
        line("Role", profile.designation),
        line("Location", profile.location),
        line("Availability", profile.availability),
        line("Email", profile.email),
        profile.showPhone ? line("Phone", profile.phone) : null,
        profile.showPhone ? line("WhatsApp", profile.whatsapp) : null,
        line("Portfolio website", siteUrl),
        line("Resume", link("Download resume", profile.resumeUrl)),
        line("GitHub", profile.githubUrl),
        line("LinkedIn", profile.linkedinUrl),
        line("Facebook", profile.facebookUrl),
        line("Contact", `the contact form at ${siteUrl}/#contact`),
      ]),
    );
    sections.push(join(["## Summary", "", profile.tagline ?? null, "", profile.aboutMe]));
  }

  if (skills.length > 0) {
    const byCategory = new Map<string, string[]>();
    for (const s of skills)
      byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), s.name]);
    sections.push(
      join([
        "## Skills",
        "",
        ...Array.from(byCategory, ([category, names]) => `- **${category}:** ${names.join(", ")}`),
      ]),
    );
  }

  if (experience.length > 0) {
    sections.push(
      join([
        "## Work experience",
        ...experience.flatMap((e) => [
          "",
          `### ${e.role} at ${e.companyUrl ? `[${e.company}](${e.companyUrl})` : e.company}`,
          `- ${EMPLOYMENT_TYPE_LABELS[e.employmentType]}, ${formatDateRange(e.startDate, e.endDate)}${
            e.location ? `, ${e.location}` : ""
          }`,
          ...e.achievements.map((a) => `- ${a}`),
          e.techStack.length > 0 ? `- Technologies: ${e.techStack.join(", ")}` : null,
        ]),
      ]),
    );
  }

  if (education.length > 0) {
    sections.push(
      join([
        "## Education",
        ...education.flatMap((e) => [
          "",
          `### ${e.degree}, ${e.institution} (${e.startYear} – ${e.endYear})`,
          e.description,
        ]),
      ]),
    );
  }

  if (projects.length > 0) {
    sections.push(
      join([
        "## Projects",
        ...projects.flatMap((p) => [
          "",
          `### ${p.name}${p.featured ? " (featured)" : ""}`,
          `- Project page: ${new URL(`/projects/${p.slug}`, `${siteUrl}/`).toString()}`,
          line("Live demo", p.liveLink),
          line("Source code", p.githubLink),
          `- Technologies: ${p.mainTechStack.join(", ")}`,
          line("Description", p.description),
          line("His role", p.role),
          line("Architecture", p.architecture),
          line("Impact", p.impact),
          line("Challenges", p.challenges),
          line("Future plans", p.futurePlans),
        ]),
      ]),
    );
  }

  return sections.join("\n\n").trim();
}

/** Rough token estimate (about 4 characters per token for English text). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Cached knowledge base. Tagged with "knowledge" and with every content tag, so any
 * admin edit (which revalidates its content tag and "knowledge") rebuilds it.
 */
export const getKnowledge = unstable_cache(
  async () => {
    const [profile, skills, experience, education, projects] = await Promise.all([
      db.profile(),
      db.skills(),
      db.experience(),
      db.education(),
      db.projects(),
    ]);
    const markdown = buildKnowledgeMarkdown({
      profile,
      skills,
      experience,
      education,
      projects,
      siteUrl: SITE_URL,
    });
    if (process.env.NODE_ENV === "development") {
      console.log(`[knowledge] rebuilt: ~${estimateTokens(markdown)} tokens`);
    }
    return {
      markdown,
      ownerName: profile?.name ?? "the site owner",
      email: profile?.email ?? null,
    };
  },
  ["chat-knowledge"],
  { tags: [KNOWLEDGE_TAG, ...Object.values(CACHE_TAGS)], revalidate: 3600 },
);
