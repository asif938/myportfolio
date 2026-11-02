import type { Education as EducationEntry } from "@prisma/client";
import { GraduationCap } from "lucide-react";
import Reveal from "@/components/Reveal";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

/** An entry is "current" when its end year is empty or says present/current/ongoing/now. */
const isCurrent = (endYear: string) => {
  const v = endYear.trim();
  return v === "" || /^(present|current|ongoing|now)$/i.test(v);
};

/**
 * Timeline. Entries arrive newest-first from the page query.
 * md+: centered line, cards alternate right (1st), left (2nd), ...
 * <md: line on the left, every card on the right in one column.
 * Line, nodes and connectors are decorative (aria-hidden). Styles: .edu-* in globals.css.
 */
export default function Education({ education }: { education: EducationEntry[] }) {
  if (!education || education.length === 0) return null;

  return (
    <Section id="education">
      <Reveal>
        <SectionHeading eyebrow="Education" title="Education" highlight="Education" />
      </Reveal>

      <ol className="relative mx-auto max-w-5xl space-y-6 md:space-y-10">
        {/* line: the wrapper is wide so the dark-mode glow is not clipped by its fade mask */}
        <span
          aria-hidden
          className="edu-line-fade absolute bottom-2 left-[22px] top-2 w-12 -translate-x-1/2 md:left-1/2"
        >
          <span className="edu-line absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full" />
        </span>

        {education.map((edu, index) => {
          const left = index % 2 === 1; // 1st right, 2nd left, ...
          const current = isCurrent(edu.endYear);
          return (
            <li
              key={edu.id}
              data-side={left ? "left" : "right"}
              className={`edu-reveal relative pl-14 md:w-1/2 md:pl-0 ${
                left ? "md:mr-auto md:pr-10" : "md:ml-auto md:pl-10"
              }`}
            >
              <span
                aria-hidden
                className={`edu-node ${current ? "edu-node-current" : ""} absolute left-0 top-5 z-10 grid h-11 w-11 place-items-center rounded-full text-[13px] font-bold md:top-[18px] md:h-12 md:w-12 md:text-sm ${
                  left ? "md:left-auto md:right-0 md:translate-x-1/2" : "md:-translate-x-1/2"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {/* 16px dash node -> card, level with the card's top row */}
              <span
                aria-hidden
                className={`absolute top-[41px] hidden h-0.5 w-4 md:block ${
                  left
                    ? "right-6 bg-gradient-to-l from-brand to-brand-2"
                    : "left-6 bg-gradient-to-r from-brand to-brand-2"
                }`}
              />

              <div
                className={`edu-card relative flex min-w-0 flex-col gap-3 rounded-3xl border border-line bg-surface p-[22px] shadow-card ${
                  current ? "edu-card-current" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color:var(--edu-icon-border)] bg-[color:var(--edu-icon-bg)] text-[color:var(--edu-icon-fg)]"
                  >
                    <GraduationCap size={20} />
                  </span>
                  <h3 className="min-w-0 break-words font-display text-xl font-bold text-fg">
                    {edu.degree}
                  </h3>
                </div>
                <p className="break-words text-[15px] font-semibold text-accent">
                  {edu.institution}
                </p>
                {edu.description && (
                  <p className="break-words text-[14.5px] leading-[1.65] text-muted">
                    {edu.description}
                  </p>
                )}
                <time className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
                  {current && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--success)]"
                    />
                  )}
                  {edu.startYear} – {edu.endYear.trim() === "" ? "Present" : edu.endYear}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
