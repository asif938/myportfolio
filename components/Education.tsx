import type { Education as EducationEntry } from "@prisma/client";
import Reveal from "@/components/Reveal";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

/**
 * Timeline. Entries arrive newest-first from the page query.
 * md+: centered line, cards alternate right (1st), left (2nd), ...
 * <md: line on the left, every card on the right in one column.
 * Line, dots and connectors are decorative (aria-hidden).
 */
export default function Education({ education }: { education: EducationEntry[] }) {
  if (!education || education.length === 0) return null;

  return (
    <Section id="education">
      <Reveal>
        <SectionHeading eyebrow="Education" title="Education" highlight="Education" />
      </Reveal>

      <ol className="relative mx-auto max-w-5xl space-y-6 md:space-y-10">
        <span
          aria-hidden
          className="absolute bottom-2 left-[19px] top-2 w-0.5 rounded-full bg-brand-gradient opacity-60 md:left-1/2 md:-translate-x-1/2"
        />
        {education.map((edu, index) => {
          const left = index % 2 === 1; // 1st right, 2nd left, ...
          return (
            <li
              key={edu.id}
              data-side={left ? "left" : "right"}
              className={`edu-reveal relative pl-14 md:w-1/2 md:pl-0 ${
                left ? "md:mr-auto md:pr-14" : "md:ml-auto md:pl-14"
              }`}
            >
              {/* dot on the line */}
              <span
                aria-hidden
                className={`absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-brand-gradient-deep text-xs font-bold text-white ring-4 ring-[var(--bg)] ${
                  left ? "md:left-auto md:right-0 md:translate-x-1/2" : "md:-translate-x-1/2"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {/* connector dot -> card */}
              <span
                aria-hidden
                className={`absolute left-10 top-11 h-0.5 w-4 -translate-y-1/2 bg-line-strong ${
                  left ? "md:left-auto md:right-5 md:w-9" : "md:left-5 md:w-9"
                }`}
              />
              <Card className="min-w-0 p-5 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="min-w-0 break-words text-lg font-bold text-fg sm:text-xl">{edu.degree}</h3>
                  <time className="shrink-0 rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
                    {edu.startYear} – {edu.endYear}
                  </time>
                </div>
                <p className="font-medium text-fg">{edu.institution}</p>
                {edu.description && (
                  <p className="mt-2 break-words text-sm leading-relaxed text-muted sm:text-base">
                    {edu.description}
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
