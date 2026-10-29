import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export function getProfile() {
  return prisma.profile.findFirst();
}

export function getSkills() {
  return prisma.skill.findMany({ orderBy: skillOrderBy });
}

export function getEducation() {
  return prisma.education.findMany({ orderBy: educationOrderBy });
}

export function getExperience() {
  return prisma.experience.findMany({ orderBy: experienceOrderBy });
}

export function getProjects() {
  return prisma.project.findMany({ orderBy: projectOrderBy });
}

/** Featured projects, or the first few projects when none are featured. */
export async function getHomeProjects() {
  const featured = await prisma.project.findMany({
    where: { featured: true },
    orderBy: projectOrderBy,
  });
  if (featured.length > 0) return featured;
  return prisma.project.findMany({ orderBy: projectOrderBy, take: HOME_PROJECTS_FALLBACK_COUNT });
}

export function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({ where: { slug } });
}

/** Used to redirect the old /projects/<id> URLs to /projects/<slug>. */
export function getProjectSlugById(id: string) {
  return prisma.project.findUnique({ where: { id }, select: { slug: true } });
}
