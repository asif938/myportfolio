"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { addProject, updateProject, deleteProject } from "@/app/actions/projectActions";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

export default function ProjectsAdminClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ 
    id: "", name: "", imageUrl: "", mainTechStack: "", description: "", liveLink: "", githubLink: "", challenges: "", futurePlans: "" 
  });
  
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentProject({ id: "", name: "", imageUrl: "", mainTechStack: "", description: "", liveLink: "", githubLink: "", challenges: "", futurePlans: "" });
    setIsEditing(false);
  };

  const handleEditClick = (project: any) => {
    setCurrentProject({
      ...project,
      mainTechStack: Array.isArray(project.mainTechStack) ? project.mainTechStack.join(", ") : project.mainTechStack
    });
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentProject({ ...currentProject, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const projectData = {
      ...currentProject,
      mainTechStack: currentProject.mainTechStack.split(",").map(t => t.trim()).filter(Boolean)
    };
    // @ts-ignore
    delete projectData.id;

    if (isEditing) {
      await updateProject(currentProject.id, projectData);
      window.location.reload();
    } else {
      await addProject(projectData);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">{isEditing ? "Edit Project" : "Add New Project"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Project Name</label>
              <input required type="text" name="name" value={currentProject.name} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium">Main Tech Stack (comma separated)</label>
              <input required type="text" name="mainTechStack" value={currentProject.mainTechStack} onChange={handleChange} placeholder="e.g. Next.js, Tailwind, Prisma" className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Brief Description</label>
              <textarea required name="description" rows={2} value={currentProject.description} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-medium">Live Link (optional)</label>
              <input type="text" name="liveLink" value={currentProject.liveLink} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium">GitHub Repository Link (optional)</label>
              <input type="text" name="githubLink" value={currentProject.githubLink} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Challenges Faced</label>
              <textarea required name="challenges" rows={3} value={currentProject.challenges} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Future Plans / Improvements</label>
              <textarea required name="futurePlans" rows={3} value={currentProject.futurePlans} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium">Project Image</label>
              {currentProject.imageUrl && (
                <div className="mb-2">
                  <Image src={currentProject.imageUrl} alt="Project Image" width={200} height={120} className="rounded object-cover" />
                </div>
              )}
              <ImageUpload 
                buttonText="Upload Project Image" 
                onUploadAction={(url) => setCurrentProject({ ...currentProject, imageUrl: url })} 
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Project"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">Existing Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 dark:border-gray-700 flex flex-col justify-between">
              <div>
                {project.imageUrl && <Image src={project.imageUrl} alt={project.name} width={400} height={200} className="rounded mb-3 object-cover h-32 w-full" />}
                <h4 className="font-bold text-lg mb-1">{project.name}</h4>
                <p className="text-sm text-gray-500 mb-2 truncate">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.mainTechStack.map((tech: string, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 border-t pt-3 dark:border-gray-700">
                <button onClick={() => handleEditClick(project)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"><Pencil size={14}/> Edit</button>
                <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm"><Trash2 size={14}/> Delete</button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-gray-500">No projects added yet.</p>}
        </div>
      </div>
    </div>
  );
}
