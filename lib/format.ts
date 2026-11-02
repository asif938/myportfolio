import type { EmploymentType } from "@prisma/client";

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "FREELANCE",
  "CONTRACT",
] as const satisfies readonly EmploymentType[];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
  CONTRACT: "Contract",
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "Jan 2024" */
export function formatMonth(date: Date): string {
  return monthFormatter.format(date);
}

/** "Jan 2023 – Present" */
export function formatDateRange(start: Date, end: Date | null): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "Present"}`;
}

/** Value for <input type="month">, e.g. "2024-01". */
export function toMonthInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 7) : "";
}
