"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import type { EmploymentType, Experience } from "@prisma/client";
import {
  addExperience,
  updateExperience,
  deleteExperience,
  reorderExperience,
} from "@/app/actions/experienceActions";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  formatDateRange,
  toMonthInput,
} from "@/lib/format";
import ReorderButtons, { moveId } from "../ReorderButtons";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type ExperienceForm = {
  id: string;
  company: string;
  role: string;
  employmentType: EmploymentType;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string;
  techStack: string;
  companyUrl: string;
  companyLogoUrl: string;
};

const emptyExperience: ExperienceForm = {
  id: "",
  company: "",
  role: "",
  employmentType: "FULL_TIME",
  location: "",
  startDate: "",
  endDate: "",
  current: true,
  achievements: "",
  techStack: "",
  companyUrl: "",
  companyLogoUrl: "",
};

function toForm(exp: Experience): ExperienceForm {
  return {
    id: exp.id,
    company: exp.company,
    role: exp.role,
    employmentType: exp.employmentType,
    location: exp.location ?? "",
    startDate: toMonthInput(exp.startDate),
    endDate: toMonthInput(exp.endDate),
    current: exp.endDate === null,
    achievements: exp.achievements.join("\n"),
    techStack: exp.techStack.join(", "),
    companyUrl: exp.companyUrl ?? "",
    companyLogoUrl: exp.companyLogoUrl ?? "",
  };
}

export default function ExperienceAdminClient({
  initialExperience,
}: {
  initialExperience: Experience[];
}) {
  const router = useRouter();
  const experiences = initialExperience;
  const [current, setCurrent] = useState<ExperienceForm>(emptyExperience);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const isEditing = current.id !== "";

  const resetForm = () => setCurrent(emptyExperience);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setCurrent({ ...current, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { id, current: isCurrent, achievements, techStack, endDate, ...rest } = current;
    const data = {
      ...rest,
      endDate: isCurrent ? null : endDate,
      achievements: achievements.split("\n").map((a) => a.trim()),
      techStack: techStack.split(",").map((t) => t.trim()),
    };

    const ok = await runAdminAction(
      () => (isEditing ? updateExperience(id, data) : addExperience(data)),
      isEditing ? "Experience updated" : "Experience added",
    );
    if (ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (exp: Experience) => {
    if (!(await confirmDelete(`"${exp.role} at ${exp.company}"`))) return;
    setDeletingId(exp.id);
    const ok = await runAdminAction(() => deleteExperience(exp.id), "Experience deleted");
    if (ok) {
      if (current.id === exp.id) resetForm();
      router.refresh();
    }
    setDeletingId(null);
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    const ids = moveId(
      experiences.map((x) => x.id),
      index,
      delta,
    );
    if (await runAdminAction(() => reorderExperience(ids), "Order saved")) router.refresh();
    setReordering(false);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="h-fit rounded-lg bg-surface p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? "Edit Experience" : "Add Experience"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="exp-role" className={labelClass}>
              Role / Title
            </label>
            <input
              id="exp-role"
              required
              name="role"
              value={current.role}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exp-company" className={labelClass}>
              Company
            </label>
            <input
              id="exp-company"
              required
              name="company"
              value={current.company}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-type" className={labelClass}>
                Employment type
              </label>
              <select
                id="exp-type"
                name="employmentType"
                value={current.employmentType}
                onChange={handleChange}
                className={inputClass}
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EMPLOYMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exp-location" className={labelClass}>
                Location (optional)
              </label>
              <input
                id="exp-location"
                name="location"
                placeholder="e.g. Remote"
                value={current.location}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-start" className={labelClass}>
                Start
              </label>
              <input
                id="exp-start"
                required
                type="month"
                name="startDate"
                value={current.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="exp-end" className={labelClass}>
                End
              </label>
              <input
                id="exp-end"
                type="month"
                name="endDate"
                required={!current.current}
                disabled={current.current}
                value={current.current ? "" : current.endDate}
                onChange={handleChange}
                className={`${inputClass} disabled:opacity-50`}
              />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.current}
                  onChange={(e) => setCurrent({ ...current, current: e.target.checked })}
                />
                I currently work here
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="exp-achievements" className={labelClass}>
              Achievements (one per line)
            </label>
            <textarea
              id="exp-achievements"
              name="achievements"
              rows={4}
              value={current.achievements}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exp-stack" className={labelClass}>
              Tech stack (comma separated)
            </label>
            <input
              id="exp-stack"
              name="techStack"
              value={current.techStack}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exp-url" className={labelClass}>
              Company website (optional)
            </label>
            <input
              id="exp-url"
              type="url"
              name="companyUrl"
              value={current.companyUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <span className={labelClass}>Company logo (optional)</span>
            {current.companyLogoUrl && (
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-[15px] border bg-white p-1.5">
                  <Image
                    src={current.companyLogoUrl}
                    alt="Company logo preview"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </span>
                <button
                  type="button"
                  onClick={() => setCurrent({ ...current, companyLogoUrl: "" })}
                  className={secondaryButtonClass}
                >
                  Remove logo
                </button>
              </div>
            )}
            <ImageUpload
              buttonText={current.companyLogoUrl ? "Replace Logo" : "Upload Logo"}
              maxFileSize={2_000_000}
              onUploadAction={(url) => setCurrent((c) => ({ ...c, companyLogoUrl: url }))}
            />
            <p className="text-xs text-muted">
              Square image, at least 200x200, transparent or white background works best, max 2 MB.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Saving..." : "Save"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-surface p-6 shadow-sm lg:col-span-3">
        <h3 className="mb-4 text-lg font-semibold">Work Experience</h3>
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <div
              key={exp.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0">
                <h4 className="text-lg font-bold">{exp.role}</h4>
                <p className="font-medium text-accent">
                  {exp.company} · {EMPLOYMENT_TYPE_LABELS[exp.employmentType]}
                </p>
                <p className="text-sm text-muted">
                  {formatDateRange(exp.startDate, exp.endDate)}
                  {exp.location ? ` · ${exp.location}` : ""}
                </p>
                {exp.achievements.length > 0 && (
                  <p className="mt-1 text-sm text-muted">
                    {exp.achievements.length} achievement
                    {exp.achievements.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ReorderButtons
                  label={exp.role}
                  index={index}
                  count={experiences.length}
                  disabled={reordering}
                  onMove={(delta) => handleMove(index, delta)}
                />
                <button
                  type="button"
                  aria-label={`Edit ${exp.role} at ${exp.company}`}
                  onClick={() => {
                    setCurrent(toForm(exp));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-accent hover:opacity-80"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${exp.role} at ${exp.company}`}
                  disabled={deletingId === exp.id}
                  onClick={() => handleDelete(exp)}
                  className="text-danger hover:opacity-80 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {experiences.length === 0 && (
            <p className="text-muted">
              No experience added yet. The public Experience section stays hidden until you add one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
