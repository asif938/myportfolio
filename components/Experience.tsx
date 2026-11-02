import type { Experience as ExperienceEntry } from "@prisma/client";
import { ExternalLink, MapPin } from "lucide-react";
import { EMPLOYMENT_TYPE_LABELS, formatDateRange, formatMonth } from "@/lib/format";
import { splitExperience } from "@/lib/experience";
import Atmosphere from "@/components/Atmosphere";
import CompanyLogo from "@/components/CompanyLogo";
import Reveal from "@/components/Reveal";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

const labelClass = "text-xs font-semibold uppercase tracking-[0.16em]";

/** Featured role (the current one) as a hero card, then earlier roles on a dated timeline. */
export default function Experience({ experience }: { experience: ExperienceEntry[] }) {
  const { featured, earlier } = splitExperience(experience);
  if (!featured) return null;

  const current = featured.endDate === null;

  return (
    <Section id="experience" backdrop={<Atmosphere variant="soft" side="right" />}>
      <Reveal>
        <SectionHeading eyebrow="Experience" title="Experience" highlight="Experience" />
      </Reveal>

      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr] lg:gap-5">
            <article className="relative min-w-0 overflow-hidden rounded-3xl bg-[image:var(--feature-bg)] p-6 text-[color:var(--feature-fg)] shadow-card sm:p-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-[36px] border-[color:var(--feature-ring)]"
              />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <CompanyLogo company={featured.company} url={featured.companyLogoUrl} />
                  {current ? (
                    <span className="rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-fg">
                      Current role
                    </span>
                  ) : (
                    <time className="rounded-full bg-[color:var(--feature-chip-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--feature-chip-fg)]">
                      {formatDateRange(featured.startDate, featured.endDate)}
                    </time>
                  )}
                </div>

                <h3 className="break-words font-display text-2xl font-bold leading-tight sm:text-[1.65rem]">
                  {featured.role}
                </h3>
                <p className="mt-1.5 break-words text-base font-medium text-[color:var(--feature-fg-soft)]">
                  {featured.companyUrl ? (
                    <a
                      href={featured.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-4 outline-offset-4 hover:underline focus-visible:outline-white"
                    >
                      {featured.company} <ExternalLink size={14} aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    featured.company
                  )}
                  {featured.location && (
                    <span className="ml-3 inline-flex items-center gap-1 text-sm opacity-90">
                      <MapPin size={13} aria-hidden="true" /> {featured.location}
                    </span>
                  )}
                </p>

                {featured.achievements.length > 0 && (
                  <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[color:var(--feature-fg-soft)] marker:text-[color:var(--feature-fg)] sm:text-base">
                    {featured.achievements.map((item, i) => (
                      <li key={i} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {featured.techStack.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies used">
                    {featured.techStack.map((tech, i) => (
                      <li
                        key={`${tech}-${i}`}
                        className="rounded-full bg-[color:var(--feature-chip-bg)] px-3 py-1 text-xs font-medium text-[color:var(--feature-chip-fg)]"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:grid-rows-2 lg:gap-5">
              <div className="flex min-w-0 flex-col justify-center rounded-3xl bg-[color:var(--feature-box-1-bg)] p-5 text-[color:var(--feature-box-1-fg)] sm:p-6">
                <p className={labelClass}>{current ? "Started" : "Period"}</p>
                <p className="mt-2 break-words font-display text-xl font-bold sm:text-2xl">
                  {current
                    ? formatMonth(featured.startDate)
                    : formatDateRange(featured.startDate, featured.endDate)}
                </p>
              </div>
              <div className="flex min-w-0 flex-col justify-center rounded-3xl bg-[color:var(--feature-box-2-bg)] p-5 text-[color:var(--feature-box-2-fg)] sm:p-6">
                <p className={labelClass}>Job type</p>
                <p className="mt-2 break-words font-display text-xl font-bold sm:text-2xl">
                  {EMPLOYMENT_TYPE_LABELS[featured.employmentType]}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {earlier.length > 0 && (
          <>
            <Reveal className="mb-8 mt-14 flex items-center gap-4">
              <h3 className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Earlier
              </h3>
              <span aria-hidden className="h-px flex-1 bg-line-strong" />
            </Reveal>

            <ol className="relative space-y-6">
              <span
                aria-hidden
                className="absolute -bottom-6 left-5 top-0 w-0.5 -translate-x-1/2 bg-brand-gradient [mask-image:linear-gradient(to_bottom,#000_60%,transparent)] md:left-[calc(10rem+1.25rem)]"
              />
              {earlier.map((exp, index) => {
                const present = exp.endDate === null;
                return (
                  <Reveal
                    as="li"
                    key={exp.id}
                    className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 md:grid-cols-[10rem_2.5rem_minmax(0,1fr)]"
                  >
                    <div className="col-start-2 row-start-1 flex flex-col items-start gap-1 md:col-start-1 md:items-end md:pt-5 md:text-right">
                      <time className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
                        {present && (
                          <span
                            aria-hidden
                            className="dot-live h-2 w-2 rounded-full bg-[color:var(--success)]"
                          />
                        )}
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </time>
                      <span className="text-xs text-muted">
                        {EMPLOYMENT_TYPE_LABELS[exp.employmentType]}
                      </span>
                    </div>

                    <span
                      aria-hidden
                      className="relative z-10 col-start-1 row-span-2 row-start-1 grid h-10 w-10 place-items-center self-start rounded-full bg-brand-gradient-deep text-xs font-bold text-white ring-4 ring-[var(--bg)] md:col-start-2 md:row-span-1 md:mt-3"
                    >
                      {String(index + 2).padStart(2, "0")}
                    </span>

                    <Card className="col-start-2 row-start-2 min-w-0 p-5 sm:p-6 md:col-start-3 md:row-start-1">
                      <article>
                        <h4 className="break-words font-display text-lg font-bold text-fg sm:text-xl">
                          {exp.role}
                        </h4>
                        <p className="mt-1.5 flex min-w-0 items-center gap-2 font-medium text-fg">
                          <CompanyLogo company={exp.company} url={exp.companyLogoUrl} size={28} />
                          <span className="min-w-0 break-words">
                            {exp.companyUrl ? (
                              <a
                                href={exp.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-accent hover:underline"
                              >
                                {exp.company} <ExternalLink size={13} aria-hidden="true" />
                                <span className="sr-only">(opens in a new tab)</span>
                              </a>
                            ) : (
                              exp.company
                            )}
                            {exp.location && (
                              <span className="text-sm font-normal text-muted">
                                {" "}
                                · {exp.location}
                              </span>
                            )}
                          </span>
                        </p>

                        {exp.achievements.length > 0 && (
                          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-brand sm:text-base">
                            {exp.achievements.map((item, i) => (
                              <li key={i} className="break-words">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {exp.techStack.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies used">
                            {exp.techStack.map((tech, i) => (
                              <li key={`${tech}-${i}`}>
                                <Chip className="px-3 py-1 text-xs">{tech}</Chip>
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </Card>
                  </Reveal>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </Section>
  );
}
