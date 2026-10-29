import { getProjects } from "@/lib/data";
import ProjectsAdminClient from "./ProjectsAdminClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return <ProjectsAdminClient initialProjects={projects} />;
}
