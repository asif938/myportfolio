import { prisma } from "@/lib/prisma";
import SkillsAdminClient from "./SkillsAdminClient";

export const revalidate = 0;

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: { category: "asc" }
  });
  
  return (
    <div>
      <SkillsAdminClient initialSkills={skills} />
    </div>
  );
}
