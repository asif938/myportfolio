"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { Skill } from "@prisma/client";
import ImageUpload from "@/components/ImageUpload";
import { addSkill, updateSkill, deleteSkill, reorderSkills } from "@/app/actions/skillActions";
import ReorderButtons, { moveId } from "../ReorderButtons";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type SkillForm = { id: string; name: string; category: string; imageUrl: string };

const CATEGORIES = ["Frontend", "Backend", "Tools", "Other"];
const emptySkill: SkillForm = { id: "", name: "", category: "Frontend", imageUrl: "" };

export default function SkillsAdminClient({ initialSkills }: { initialSkills: Skill[] }) {
  const router = useRouter();
  const skills = initialSkills;
  const [currentSkill, setCurrentSkill] = useState<SkillForm>(emptySkill);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const handleMove = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    const ids = moveId(
      skills.map((s) => s.id),
      index,
      delta,
    );
    if (await runAdminAction(() => reorderSkills(ids), "Order saved")) router.refresh();
    setReordering(false);
  };
  const isEditing = currentSkill.id !== "";

  const categories = CATEGORIES.includes(currentSkill.category)
    ? CATEGORIES
    : [...CATEGORIES, currentSkill.category];

  const resetForm = () => setCurrentSkill(emptySkill);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { id, ...skillData } = currentSkill;
    const ok = await runAdminAction(
      () => (isEditing ? updateSkill(id, skillData) : addSkill(skillData)),
      isEditing ? "Skill updated" : "Skill added",
    );
    if (ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (skill: Skill) => {
    if (!(await confirmDelete(`"${skill.name}"`))) return;
    setDeletingId(skill.id);
    const ok = await runAdminAction(() => deleteSkill(skill.id), "Skill deleted");
    if (ok) {
      if (currentSkill.id === skill.id) resetForm();
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="h-fit rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-1">
        <h3 className="mb-4 text-lg font-semibold">{isEditing ? "Edit Skill" : "Add New Skill"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="skill-name" className={labelClass}>
              Name
            </label>
            <input
              id="skill-name"
              required
              type="text"
              value={currentSkill.name}
              onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="skill-category" className={labelClass}>
              Category
            </label>
            <select
              id="skill-category"
              value={currentSkill.category}
              onChange={(e) => setCurrentSkill({ ...currentSkill, category: e.target.value })}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <span className={labelClass}>Logo/Image (Optional)</span>
            {currentSkill.imageUrl && (
              <div className="mb-2 flex items-center gap-3">
                <Image
                  src={currentSkill.imageUrl}
                  alt="Skill logo preview"
                  width={48}
                  height={48}
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => setCurrentSkill({ ...currentSkill, imageUrl: "" })}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            )}
            <ImageUpload
              buttonText="Upload Logo"
              onUploadAction={(url) => setCurrentSkill((s) => ({ ...s, imageUrl: url }))}
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

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold">Existing Skills</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Order
                </th>
                <th scope="col" className="px-4 py-3">
                  Logo
                </th>
                <th scope="col" className="px-4 py-3">
                  Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Category
                </th>
                <th scope="col" className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => (
                <tr key={skill.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3">
                    <ReorderButtons
                      label={skill.name}
                      index={index}
                      count={skills.length}
                      disabled={reordering}
                      onMove={(delta) => handleMove(index, delta)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {skill.imageUrl ? (
                      <Image
                        src={skill.imageUrl}
                        alt={skill.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {skill.name}
                  </td>
                  <td className="px-4 py-3">{skill.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${skill.name}`}
                        onClick={() =>
                          setCurrentSkill({
                            id: skill.id,
                            name: skill.name,
                            category: skill.category,
                            imageUrl: skill.imageUrl ?? "",
                          })
                        }
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${skill.name}`}
                        disabled={deletingId === skill.id}
                        onClick={() => handleDelete(skill)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center">
                    No skills added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
