import { getEducation } from "@/lib/data";
import EducationAdminClient from "./EducationAdminClient";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const education = await getEducation();

  return <EducationAdminClient initialEducation={education} />;
}
