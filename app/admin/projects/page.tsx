import { prisma } from "@/lib/prisma";
import ProjectsAdminClient from "./ProjectsAdminClient";

export const revalidate = 0;

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany();
  
  return (
    <div>
      <ProjectsAdminClient initialProjects={projects} />
    </div>
  );
}
