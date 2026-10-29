import { db } from "@/lib/data";
import SkillsAdminClient from "./SkillsAdminClient";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await db.skills();

  return <SkillsAdminClient initialSkills={skills} />;
}
