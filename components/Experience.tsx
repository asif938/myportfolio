import type { Experience as ExperienceEntry } from "@prisma/client";
import { Briefcase, ExternalLink, MapPin } from "lucide-react";
import { EMPLOYMENT_TYPE_LABELS, formatDateRange } from "@/lib/format";
import Reveal from "@/components/Reveal";

export default function Experience({ experience }: { experience: ExperienceEntry[] }) {
  if (experience.length === 0) return null;

  return (
    <section
      id="experience"
      tabIndex={-1}
      className="scroll-mt-16 bg-gray-50 py-24 outline-none dark:bg-gray-950"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Experience
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </Reveal>

        <ol className="relative space-y-10 border-l-2 border-gray-200 pl-8 dark:border-gray-800">
          {experience.map((exp) => (
            <Reveal as="li" key={exp.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[2.6rem] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-gray-50 bg-indigo-600 text-white dark:border-gray-950"
              >
                <Briefcase size={14} />
              </span>
              <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exp.role}</h3>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {exp.companyUrl ? (
                        <a
                          href={exp.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {exp.company} <ExternalLink size={14} aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ) : (
                        exp.company
                      )}
                      <span className="text-gray-400"> · </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {EMPLOYMENT_TYPE_LABELS[exp.employmentType]}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-sm sm:text-right">
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </p>
                    {exp.location && (
                      <p className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <MapPin size={12} aria-hidden="true" /> {exp.location}
                      </p>
                    )}
                  </div>
                </div>

                {exp.achievements.length > 0 && (
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-600 marker:text-indigo-500 dark:text-gray-300">
                    {exp.achievements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}

                {exp.techStack.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies used">
                    {exp.techStack.map((tech, i) => (
                      <li
                        key={`${tech}-${i}`}
                        className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
