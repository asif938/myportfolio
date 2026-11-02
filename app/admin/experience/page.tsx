import { db } from "@/lib/data";
import ExperienceAdminClient from "./ExperienceAdminClient";

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const experience = await db.experience();

  return <ExperienceAdminClient initialExperience={experience} />;
}
