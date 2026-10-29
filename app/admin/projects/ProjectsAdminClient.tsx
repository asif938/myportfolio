"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { Project } from "@prisma/client";
import ImageUpload from "@/components/ImageUpload";
import { addProject, updateProject, deleteProject } from "@/app/actions/projectActions";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type ProjectForm = {
  id: string;
  name: string;
  imageUrl: string;
  mainTechStack: string;
  description: string;
  liveLink: string;
  githubLink: string;
  challenges: string;
  futurePlans: string;
};

const emptyProject: ProjectForm = {
  id: "",
  name: "",
  imageUrl: "",
  mainTechStack: "",
  description: "",
  liveLink: "",
  githubLink: "",
  challenges: "",
  futurePlans: "",
};

function toForm(project: Project): ProjectForm {
  return {
    id: project.id,
    name: project.name,
    imageUrl: project.imageUrl ?? "",
    mainTechStack: project.mainTechStack.join(", "),
    description: project.description,
    liveLink: project.liveLink ?? "",
    githubLink: project.githubLink ?? "",
    challenges: project.challenges,
    futurePlans: project.futurePlans,
  };
}

export default function ProjectsAdminClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const projects = initialProjects;
  const [currentProject, setCurrentProject] = useState<ProjectForm>(emptyProject);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isEditing = currentProject.id !== "";

  const resetForm = () => setCurrentProject(emptyProject);

  const handleEditClick = (project: Project) => {
    setCurrentProject(toForm(project));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentProject({ ...currentProject, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { id, ...rest } = currentProject;
    const projectData = {
      ...rest,
      mainTechStack: rest.mainTechStack.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const ok = await runAdminAction(
      () => (isEditing ? updateProject(id, projectData) : addProject(projectData)),
      isEditing ? "Project updated" : "Project added",
    );
    if (ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (project: Project) => {
    if (!(await confirmDelete(`"${project.name}"`))) return;
    setDeletingId(project.id);
    const ok = await runAdminAction(() => deleteProject(project.id), "Project deleted");
    if (ok) {
      if (currentProject.id === project.id) resetForm();
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">{isEditing ? "Edit Project" : "Add New Project"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="project-name" className={labelClass}>Project Name</label>
              <input id="project-name" required type="text" name="name" value={currentProject.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="project-stack" className={labelClass}>Main Tech Stack (comma separated)</label>
              <input id="project-stack" required type="text" name="mainTechStack" value={currentProject.mainTechStack} onChange={handleChange} placeholder="e.g. Next.js, Tailwind, Prisma" className={inputClass} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project-description" className={labelClass}>Brief Description</label>
              <textarea id="project-description" required name="description" rows={2} value={currentProject.description} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label htmlFor="project-live" className={labelClass}>Live Link (optional)</label>
              <input id="project-live" type="url" name="liveLink" value={currentProject.liveLink} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="project-github" className={labelClass}>GitHub Repository Link (optional)</label>
              <input id="project-github" type="url" name="githubLink" value={currentProject.githubLink} onChange={handleChange} className={inputClass} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project-challenges" className={labelClass}>Challenges Faced</label>
              <textarea id="project-challenges" required name="challenges" rows={3} value={currentProject.challenges} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="project-future" className={labelClass}>Future Plans / Improvements</label>
              <textarea id="project-future" required name="futurePlans" rows={3} value={currentProject.futurePlans} onChange={handleChange} className={inputClass} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>Project Image</span>
              {currentProject.imageUrl && (
                <div className="mb-2">
                  <Image src={currentProject.imageUrl} alt="Project image preview" width={200} height={120} className="rounded object-cover" />
                </div>
              )}
              <ImageUpload
                buttonText="Upload Project Image"
                onUploadAction={(url) => setCurrentProject((p) => ({ ...p, imageUrl: url }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Saving..." : "Save Project"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} disabled={saving} className={secondaryButtonClass}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">Existing Projects</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="flex flex-col justify-between rounded-lg border p-4 dark:border-gray-700">
              <div>
                {project.imageUrl && <Image src={project.imageUrl} alt={project.name} width={400} height={200} className="mb-3 h-32 w-full rounded object-cover" />}
                <h4 className="mb-1 text-lg font-bold">{project.name}</h4>
                <p className="mb-2 truncate text-sm text-gray-500">{project.description}</p>
                <div className="mb-4 flex flex-wrap gap-1">
                  {project.mainTechStack.map((tech) => (
                    <span key={tech} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 border-t pt-3 dark:border-gray-700">
                <button type="button" onClick={() => handleEditClick(project)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400">
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === project.id}
                  onClick={() => handleDelete(project)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400"
                >
                  <Trash2 size={14} /> {deletingId === project.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-gray-500">No projects added yet.</p>}
        </div>
      </div>
    </div>
  );
}
