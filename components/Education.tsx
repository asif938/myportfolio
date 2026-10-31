import type { Education as EducationEntry } from "@prisma/client";
import Reveal from "@/components/Reveal";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Education({ education }: { education: EducationEntry[] }) {
  if (!education || education.length === 0) return null;

  return (
    <Section id="education">
      <Reveal>
        <SectionHeading eyebrow="Education" title="Education" highlight="Education" />
      </Reveal>

      <ol className="relative mx-auto max-w-3xl space-y-6">
        {/* single vertical gradient line */}
        <span aria-hidden className="absolute bottom-2 left-[19px] top-2 w-0.5 rounded-full bg-brand-gradient opacity-60" />
        {education.map((edu, index) => (
          <li key={edu.id} className="relative pl-14">
            <span
              aria-hidden
              className="absolute left-0 top-6 grid h-10 w-10 place-items-center rounded-full bg-brand-gradient-deep text-xs font-bold text-white ring-4 ring-[var(--bg)]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <Card className="p-5 sm:p-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-fg sm:text-xl">{edu.degree}</h3>
                <time className="rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
                  {edu.startYear} – {edu.endYear}
                </time>
              </div>
              <p className="mb-2 font-medium text-fg">{edu.institution}</p>
              <p className="text-sm leading-relaxed text-muted sm:text-base">{edu.description}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}
