import { getExperience } from "@/lib/data";
import ExperienceAdminClient from "./ExperienceAdminClient";

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const experience = await getExperience();

  return <ExperienceAdminClient initialExperience={experience} />;
}
