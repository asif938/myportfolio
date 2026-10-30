import { prisma } from "@/lib/prisma";
import FaqAdminClient from "./FaqAdminClient";

export const dynamic = "force-dynamic";

/** `?q=…&a=…` prefills the form (used by "Add to FAQ" in conversations). */
export default async function FaqPage({
  searchParams,
}: {
  searchParams: { q?: string; a?: string };
}) {
  const faqs = await prisma.faq.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return (
    <FaqAdminClient
      initialFaqs={faqs}
      prefill={{
        question: typeof searchParams.q === "string" ? searchParams.q.slice(0, 300) : "",
        answer: typeof searchParams.a === "string" ? searchParams.a.slice(0, 4000) : "",
      }}
    />
  );
}
