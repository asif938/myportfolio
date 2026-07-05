"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { addSkill, updateSkill, deleteSkill } from "@/app/actions/skillActions";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

export default function SkillsAdminClient({ initialSkills }: { initialSkills: any[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSkill, setCurrentSkill] = useState({ id: "", name: "", category: "Frontend", imageUrl: "" });
  
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentSkill({ id: "", name: "", category: "Frontend", imageUrl: "" });
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (isEditing) {
      await updateSkill(currentSkill.id, {
        name: currentSkill.name,
        category: currentSkill.category,
        imageUrl: currentSkill.imageUrl,
      });
      setSkills(skills.map(s => s.id === currentSkill.id ? currentSkill : s));
    } else {
      await addSkill({
        name: currentSkill.name,
        category: currentSkill.category,
        imageUrl: currentSkill.imageUrl,
      });
      // A full page reload or optimistic update. Next.js server actions with revalidatePath will refresh the data if we use router.refresh() 
      // But for simplicity, we just reload the page to get the new ID from the server
      window.location.reload();
    }
    
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      await deleteSkill(id);
      setSkills(skills.filter(s => s.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 h-fit">
        <h3 className="mb-4 text-lg font-semibold">{isEditing ? "Edit Skill" : "Add New Skill"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input required type="text" value={currentSkill.name} onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select value={currentSkill.category} onChange={(e) => setCurrentSkill({ ...currentSkill, category: e.target.value })} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600">
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Logo/Image (Optional)</label>
            {currentSkill.imageUrl && (
              <div className="mb-2">
                <Image src={currentSkill.imageUrl} alt="Skill Logo" width={48} height={48} className="object-contain" />
              </div>
            )}
            <ImageUpload 
              buttonText="Upload Logo" 
              onUploadAction={(url) => setCurrentSkill({ ...currentSkill, imageUrl: url })} 
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              {saving ? "Saving..." : "Save"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="md:col-span-2 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">Existing Skills</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3">
                    {skill.imageUrl ? <Image src={skill.imageUrl} alt={skill.name} width={32} height={32} className="object-contain" /> : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{skill.name}</td>
                  <td className="px-4 py-3">{skill.category}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => { setIsEditing(true); setCurrentSkill(skill); }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(skill.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center">No skills added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
