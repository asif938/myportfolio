import type { Experience, Prisma, Project } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Data access for the site.
 *
 * - `db.*` reads straight from the database (used by the admin panel).
 * - The exported `get*` functions are cached with `unstable_cache` and tagged, so the
 *   public site is served from cache until a Server Action calls `revalidateTag(tag)`.
 */

export const CACHE_TAGS = {
  profile: "profile",
  projects: "projects",
  skills: "skills",
  education: "education",
  experience: "experience",
} as const;

/**
 * Safety net: cached data is refreshed at least this often (seconds), so changes made
 * outside the admin panel (e.g. a migration or a manual DB edit) still show up.
 * Admin edits invalidate the cache immediately via tags.
 */
const MAX_CACHE_AGE = 60 * 60;

/** Canonical sort orders. Admin pages and the public site both use these. */
export const projectOrderBy: Prisma.ProjectOrderByWithRelationInput[] = [
  { order: "asc" },
  { createdAt: "desc" },
];
export const skillOrderBy: Prisma.SkillOrderByWithRelationInput[] = [
  { order: "asc" },
  { name: "asc" },
];
export const educationOrderBy: Prisma.EducationOrderByWithRelationInput[] = [
  { order: "asc" },
  { startYear: "desc" },
];
export const experienceOrderBy: Prisma.ExperienceOrderByWithRelationInput[] = [
  { order: "asc" },
  { startDate: "desc" },
];

/** Number of projects shown on the home page when none are marked as featured. */
export const HOME_PROJECTS_FALLBACK_COUNT = 6;

/** Uncached queries. */
export const db = {
  profile: () => prisma.profile.findFirst(),
  skills: () => prisma.skill.findMany({ orderBy: skillOrderBy }),
  education: () => prisma.education.findMany({ orderBy: educationOrderBy }),
  experience: () => prisma.experience.findMany({ orderBy: experienceOrderBy }),
  projects: () => prisma.project.findMany({ orderBy: projectOrderBy }),
};

// The cache stores JSON, so Date fields come back as strings on a cache hit.
// These helpers turn them back into Date objects.
const toDate = (value: Date | string) => new Date(value);

function reviveProject(p: Project): Project {
  return { ...p, createdAt: toDate(p.createdAt), updatedAt: toDate(p.updatedAt) };
}

function reviveExperience(e: Experience): Experience {
  return {
    ...e,
    startDate: toDate(e.startDate),
    endDate: e.endDate ? toDate(e.endDate) : null,
    createdAt: toDate(e.createdAt),
    updatedAt: toDate(e.updatedAt),
  };
}

const cachedProfile = unstable_cache(db.profile, ["profile"], {
  tags: [CACHE_TAGS.profile],
  revalidate: MAX_CACHE_AGE,
});
const cachedSkills = unstable_cache(db.skills, ["skills"], {
  tags: [CACHE_TAGS.skills],
  revalidate: MAX_CACHE_AGE,
});
const cachedEducation = unstable_cache(db.education, ["education"], {
  tags: [CACHE_TAGS.education],
  revalidate: MAX_CACHE_AGE,
});
const cachedExperience = unstable_cache(db.experience, ["experience"], {
  tags: [CACHE_TAGS.experience],
  revalidate: MAX_CACHE_AGE,
});
const cachedProjects = unstable_cache(db.projects, ["projects"], {
  tags: [CACHE_TAGS.projects],
  revalidate: MAX_CACHE_AGE,
});

export function getProfile() {
  return cachedProfile();
}

export function getSkills() {
  return cachedSkills();
}

export function getEducation() {
  return cachedEducation();
}

export async function getExperience() {
  return (await cachedExperience()).map(reviveExperience);
}

/** All projects in display order. */
export async function getProjects() {
  return (await cachedProjects()).map(reviveProject);
}

/** Featured projects, or the first few projects when none are featured. */
export async function getHomeProjects() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  return featured.length > 0 ? featured : projects.slice(0, HOME_PROJECTS_FALLBACK_COUNT);
}

export async function getProjectBySlug(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

/** Used to redirect the old /projects/<id> URLs to /projects/<slug>. */
export function getProjectSlugById(id: string) {
  return prisma.project.findUnique({ where: { id }, select: { slug: true } });
}
