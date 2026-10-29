"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Education } from "@prisma/client";
import {
  addEducation,
  updateEducation,
  deleteEducation,
  reorderEducation,
} from "@/app/actions/educationActions";
import ReorderButtons, { moveId } from "../ReorderButtons";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type EducationForm = Pick<
  Education,
  "id" | "institution" | "degree" | "startYear" | "endYear" | "description"
>;

const emptyEducation: EducationForm = {
  id: "",
  institution: "",
  degree: "",
  startYear: "",
  endYear: "",
  description: "",
};

export default function EducationAdminClient({
  initialEducation,
}: {
  initialEducation: Education[];
}) {
  const router = useRouter();
  const educations = initialEducation;
  const [currentEdu, setCurrentEdu] = useState<EducationForm>(emptyEducation);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const handleMove = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    const ids = moveId(
      educations.map((e) => e.id),
      index,
      delta,
    );
    if (await runAdminAction(() => reorderEducation(ids), "Order saved")) router.refresh();
    setReordering(false);
  };
  const isEditing = currentEdu.id !== "";

  const resetForm = () => setCurrentEdu(emptyEducation);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentEdu({ ...currentEdu, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { id, ...eduData } = currentEdu;
    const ok = await runAdminAction(
      () => (isEditing ? updateEducation(id, eduData) : addEducation(eduData)),
      isEditing ? "Education updated" : "Education added",
    );
    if (ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (edu: Education) => {
    if (!(await confirmDelete(`"${edu.degree}"`))) return;
    setDeletingId(edu.id);
    const ok = await runAdminAction(() => deleteEducation(edu.id), "Education deleted");
    if (ok) {
      if (currentEdu.id === edu.id) resetForm();
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="h-fit rounded-lg bg-white p-6 shadow-sm lg:col-span-1 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? "Edit Education" : "Add Education"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="edu-institution" className={labelClass}>
              Institution
            </label>
            <input
              id="edu-institution"
              required
              type="text"
              name="institution"
              value={currentEdu.institution}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edu-degree" className={labelClass}>
              Degree / Qualification
            </label>
            <input
              id="edu-degree"
              required
              type="text"
              name="degree"
              value={currentEdu.degree}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="edu-start" className={labelClass}>
                Start Year
              </label>
              <input
                id="edu-start"
                required
                type="text"
                name="startYear"
                value={currentEdu.startYear}
                onChange={handleChange}
                placeholder="e.g. 2018"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edu-end" className={labelClass}>
                End Year
              </label>
              <input
                id="edu-end"
                required
                type="text"
                name="endYear"
                value={currentEdu.endYear}
                onChange={handleChange}
                placeholder="e.g. 2022 or Present"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="edu-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="edu-description"
              required
              name="description"
              rows={3}
              value={currentEdu.description}
              onChange={handleChange}
              className={inputClass}
            />
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

      <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">Educational Qualifications</h3>
        <div className="space-y-4">
          {educations.map((edu, index) => (
            <div
              key={edu.id}
              className="flex items-start justify-between rounded-lg border p-4 dark:border-gray-700"
            >
              <div className="min-w-0">
                <h4 className="text-lg font-bold">{edu.degree}</h4>
                <p className="font-medium text-indigo-600 dark:text-indigo-400">
                  {edu.institution}
                </p>
                <p className="mb-2 text-sm text-gray-500">
                  {edu.startYear} - {edu.endYear}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{edu.description}</p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <ReorderButtons
                  label={edu.degree}
                  index={index}
                  count={educations.length}
                  disabled={reordering}
                  onMove={(delta) => handleMove(index, delta)}
                />
                <button
                  type="button"
                  aria-label={`Edit ${edu.degree}`}
                  onClick={() => setCurrentEdu(edu)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${edu.degree}`}
                  disabled={deletingId === edu.id}
                  onClick={() => handleDelete(edu)}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {educations.length === 0 && (
            <p className="text-gray-500">No education entries added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
