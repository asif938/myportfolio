import { db } from "@/lib/data";
import EducationAdminClient from "./EducationAdminClient";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const education = await db.education();

  return <EducationAdminClient initialEducation={education} />;
}
