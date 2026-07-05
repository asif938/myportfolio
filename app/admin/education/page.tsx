import { prisma } from "@/lib/prisma";
import EducationAdminClient from "./EducationAdminClient";

export const revalidate = 0;

export default async function EducationPage() {
  const education = await prisma.education.findMany({
    orderBy: { startYear: 'desc' }
  });
  
  return (
    <div>
      <EducationAdminClient initialEducation={education} />
    </div>
  );
}
