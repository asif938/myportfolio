import { getSkills } from "@/lib/data";
import SkillsAdminClient from "./SkillsAdminClient";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await getSkills();

  return <SkillsAdminClient initialSkills={skills} />;
}
