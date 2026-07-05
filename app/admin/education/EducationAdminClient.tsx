"use client";

import { useState } from "react";
import { addEducation, updateEducation, deleteEducation } from "@/app/actions/educationActions";
import { Pencil, Trash2 } from "lucide-react";

export default function EducationAdminClient({ initialEducation }: { initialEducation: any[] }) {
  const [educations, setEducations] = useState(initialEducation);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdu, setCurrentEdu] = useState({ 
    id: "", institution: "", degree: "", startYear: "", endYear: "", description: ""
  });
  
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentEdu({ id: "", institution: "", degree: "", startYear: "", endYear: "", description: "" });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentEdu({ ...currentEdu, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const eduData = { ...currentEdu };
    // @ts-ignore
    delete eduData.id;

    if (isEditing) {
      await updateEducation(currentEdu.id, eduData);
      window.location.reload();
    } else {
      await addEducation(eduData);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this education entry?")) {
      await deleteEducation(id);
      setEducations(educations.filter(e => e.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 h-fit">
        <h3 className="mb-4 text-lg font-semibold">{isEditing ? "Edit Education" : "Add Education"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Institution</label>
            <input required type="text" name="institution" value={currentEdu.institution} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Degree / Qualification</label>
            <input required type="text" name="degree" value={currentEdu.degree} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Start Year</label>
              <input required type="text" name="startYear" value={currentEdu.startYear} onChange={handleChange} placeholder="e.g. 2018" className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium">End Year</label>
              <input required type="text" name="endYear" value={currentEdu.endYear} onChange={handleChange} placeholder="e.g. 2022 or Present" className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea required name="description" rows={3} value={currentEdu.description} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
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
        <h3 className="mb-4 text-lg font-semibold">Educational Qualifications</h3>
        <div className="space-y-4">
          {educations.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start border rounded-lg p-4 dark:border-gray-700">
              <div>
                <h4 className="font-bold text-lg">{edu.degree}</h4>
                <p className="font-medium text-indigo-600 dark:text-indigo-400">{edu.institution}</p>
                <p className="text-sm text-gray-500 mb-2">{edu.startYear} - {edu.endYear}</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{edu.description}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => { setIsEditing(true); setCurrentEdu(edu); }} className="text-blue-600 hover:text-blue-900"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(edu.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {educations.length === 0 && <p className="text-gray-500">No education entries added yet.</p>}
        </div>
      </div>
    </div>
  );
}
