import type { Experience as ExperienceEntry } from "@prisma/client";
import { ExternalLink, MapPin } from "lucide-react";
import { EMPLOYMENT_TYPE_LABELS, formatDateRange } from "@/lib/format";
import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

/**
 * Timeline, same pattern as Education: centered line with alternating cards on md+,
 * line on the left and one column below md. Line, dots and connectors are decorative.
 */
export default function Experience({ experience }: { experience: ExperienceEntry[] }) {
  if (experience.length === 0) return null;

  return (
    <Section id="experience" backdrop={<Atmosphere variant="soft" side="right" />}>
      <Reveal>
        <SectionHeading eyebrow="Experience" title="Experience" highlight="Experience" />
      </Reveal>

      <ol className="relative mx-auto max-w-5xl space-y-6 md:space-y-10">
        <span
          aria-hidden
          className="absolute bottom-2 left-[19px] top-2 w-0.5 rounded-full bg-brand-gradient opacity-60 md:left-1/2 md:-translate-x-1/2"
        />
        {experience.map((exp, index) => {
          const left = index % 2 === 1; // 1st right, 2nd left, ...
          return (
            <li
              key={exp.id}
              data-side={left ? "left" : "right"}
              className={`edu-reveal relative pl-14 md:w-1/2 md:pl-0 ${
                left ? "md:mr-auto md:pr-14" : "md:ml-auto md:pl-14"
              }`}
            >
              <span
                aria-hidden
                className={`absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-brand-gradient-deep text-xs font-bold text-white ring-4 ring-[var(--bg)] ${
                  left ? "md:left-auto md:right-0 md:translate-x-1/2" : "md:-translate-x-1/2"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden
                className={`absolute left-10 top-11 h-0.5 w-4 -translate-y-1/2 bg-line-strong ${
                  left ? "md:left-auto md:right-5 md:w-9" : "md:left-5 md:w-9"
                }`}
              />
              <Card className="min-w-0 p-5 sm:p-7">
                <article>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold text-fg sm:text-xl">
                        {exp.role}
                      </h3>
                      <p className="mt-1 font-medium text-fg">
                        {exp.companyUrl ? (
                          <a
                            href={exp.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                          >
                            {exp.company} <ExternalLink size={14} aria-hidden="true" />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        ) : (
                          exp.company
                        )}
                        <span className="text-muted"> · </span>
                        <span className="text-sm text-muted">
                          {EMPLOYMENT_TYPE_LABELS[exp.employmentType]}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                      <time className="rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </time>
                      {exp.location && (
                        <p className="inline-flex items-center gap-1 text-xs text-muted">
                          <MapPin size={12} aria-hidden="true" /> {exp.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {exp.achievements.length > 0 && (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-brand sm:text-base">
                      {exp.achievements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {exp.techStack.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies used">
                      {exp.techStack.map((tech, i) => (
                        <li key={`${tech}-${i}`}>
                          <Chip className="px-3 py-1 text-xs">{tech}</Chip>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
