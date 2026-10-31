"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Pencil, Star, Trash2, X } from "lucide-react";
import type { Project } from "@prisma/client";
import ImageUpload from "@/components/ImageUpload";
import {
  addProject,
  updateProject,
  deleteProject,
  reorderProjects,
} from "@/app/actions/projectActions";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import { slugify } from "@/lib/slug";
import ReorderButtons, { moveId } from "../ReorderButtons";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type ProjectForm = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  images: string[];
  mainTechStack: string;
  description: string;
  liveLink: string;
  githubLink: string;
  challenges: string;
  futurePlans: string;
  role: string;
  architecture: string;
  impact: string;
  featured: boolean;
};

type TextField = Exclude<keyof ProjectForm, "images" | "featured">;

const emptyProject: ProjectForm = {
  id: "",
  name: "",
  slug: "",
  imageUrl: "",
  images: [],
  mainTechStack: "",
  description: "",
  liveLink: "",
  githubLink: "",
  challenges: "",
  futurePlans: "",
  role: "",
  architecture: "",
  impact: "",
  featured: false,
};

function toForm(project: Project): ProjectForm {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    imageUrl: project.imageUrl ?? "",
    images: project.images,
    mainTechStack: project.mainTechStack.join(", "),
    description: project.description,
    liveLink: project.liveLink ?? "",
    githubLink: project.githubLink ?? "",
    challenges: project.challenges,
    futurePlans: project.futurePlans,
    role: project.role ?? "",
    architecture: project.architecture ?? "",
    impact: project.impact ?? "",
    featured: project.featured,
  };
}

export default function ProjectsAdminClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const projects = initialProjects;
  const [currentProject, setCurrentProject] = useState<ProjectForm>(emptyProject);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const isEditing = currentProject.id !== "";

  const resetForm = () => setCurrentProject(emptyProject);

  const handleEditClick = (project: Project) => {
    setCurrentProject(toForm(project));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as TextField;
    setCurrentProject({ ...currentProject, [name]: e.target.value });
  };

  const moveGalleryImage = (index: number, delta: -1 | 1) => {
    setCurrentProject((p) => ({ ...p, images: moveId(p.images, index, delta) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { id, ...rest } = currentProject;
    const projectData = {
      ...rest,
      mainTechStack: rest.mainTechStack.split(",").map((t) => t.trim()),
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

  const handleMove = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    const ids = moveId(
      projects.map((p) => p.id),
      index,
      delta,
    );
    if (await runAdminAction(() => reorderProjects(ids), "Order saved")) router.refresh();
    setReordering(false);
  };

  const textArea = (
    name: TextField,
    label: string,
    rows: number,
    required = false,
    hint?: string,
  ) => (
    <div className="md:col-span-2">
      <label htmlFor={`project-${name}`} className={labelClass}>
        {label}
      </label>
      <textarea
        id={`project-${name}`}
        required={required}
        name={name}
        rows={rows}
        value={currentProject[name]}
        onChange={handleChange}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? "Edit Project" : "Add New Project"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="project-name" className={labelClass}>
                Project Name
              </label>
              <input
                id="project-name"
                required
                type="text"
                name="name"
                value={currentProject.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="project-slug" className={labelClass}>
                URL slug
              </label>
              <input
                id="project-slug"
                type="text"
                name="slug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder={slugify(currentProject.name || "my-project")}
                value={currentProject.slug}
                onChange={handleChange}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">
                {isEditing
                  ? "Changing it changes the page URL. Leave empty to keep the current one."
                  : "Leave empty to generate it from the name."}
              </p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="project-mainTechStack" className={labelClass}>
                Main Tech Stack (comma separated)
              </label>
              <input
                id="project-mainTechStack"
                required
                type="text"
                name="mainTechStack"
                value={currentProject.mainTechStack}
                onChange={handleChange}
                placeholder="e.g. Next.js, Tailwind, Prisma"
                className={inputClass}
              />
            </div>

            {textArea("description", "Brief Description", 2, true)}

            <div>
              <label htmlFor="project-liveLink" className={labelClass}>
                Live Link (optional)
              </label>
              <input
                id="project-liveLink"
                type="url"
                name="liveLink"
                value={currentProject.liveLink}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="project-githubLink" className={labelClass}>
                GitHub Repository Link (optional)
              </label>
              <input
                id="project-githubLink"
                type="url"
                name="githubLink"
                value={currentProject.githubLink}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {textArea("role", "My Role (optional)", 3, false, "What you were responsible for.")}
            {textArea(
              "architecture",
              "Architecture (optional)",
              4,
              false,
              "How it works: main components, data flow, notable technical choices.",
            )}
            {textArea(
              "impact",
              "Impact (optional)",
              3,
              false,
              "Results: users, metrics, outcomes.",
            )}
            {textArea("challenges", "Challenges Faced", 3, true)}
            {textArea("futurePlans", "Future Plans / Improvements", 3, true)}

            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
              <input
                type="checkbox"
                checked={currentProject.featured}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, featured: e.target.checked })
                }
              />
              Featured (shown on the home page)
            </label>

            <div className="space-y-2">
              <span className={labelClass}>Cover Image</span>
              {currentProject.imageUrl && (
                <div className="mb-2 flex items-start gap-2">
                  <Image
                    src={currentProject.imageUrl}
                    alt="Cover image preview"
                    width={200}
                    height={120}
                    className="rounded object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove cover image"
                    onClick={() => setCurrentProject({ ...currentProject, imageUrl: "" })}
                    className="rounded p-1 text-danger hover:bg-danger-bg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <ImageUpload
                buttonText="Upload Cover Image"
                onUploadAction={(url) => setCurrentProject((p) => ({ ...p, imageUrl: url }))}
              />
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Gallery ({currentProject.images.length}/20)</span>
              {currentProject.images.length > 0 && (
                <ul className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {currentProject.images.map((url, index) => (
                    <li key={url} className="relative rounded border p-1">
                      <Image
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        width={160}
                        height={100}
                        className="h-20 w-full rounded object-cover"
                      />
                      <div className="mt-1 flex justify-between">
                        <div className="flex">
                          <button
                            type="button"
                            aria-label={`Move image ${index + 1} left`}
                            disabled={index === 0}
                            onClick={() => moveGalleryImage(index, -1)}
                            className="rounded p-1 disabled:opacity-30"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move image ${index + 1} right`}
                            disabled={index === currentProject.images.length - 1}
                            onClick={() => moveGalleryImage(index, 1)}
                            className="rounded p-1 disabled:opacity-30"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove image ${index + 1}`}
                          onClick={() =>
                            setCurrentProject((p) => ({
                              ...p,
                              images: p.images.filter((_, i) => i !== index),
                            }))
                          }
                          className="rounded p-1 text-danger"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <ImageUpload
                multiple
                buttonText="Add Gallery Images"
                onUploadAction={(url) =>
                  setCurrentProject((p) =>
                    p.images.includes(url) || p.images.length >= 20
                      ? p
                      : { ...p, images: [...p.images, url] },
                  )
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Saving..." : "Save Project"}
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

      <div className="rounded-lg bg-surface p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold">Existing Projects</h3>
        <p className="mb-4 text-sm text-muted">
          Shown in this order on the site. Featured projects appear on the home page; if none are
          featured, the first six are shown.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="flex flex-col justify-between rounded-lg border p-4"
            >
              <div>
                {project.imageUrl && (
                  <Image
                    src={project.imageUrl}
                    alt={project.name}
                    width={400}
                    height={200}
                    className="mb-3 h-32 w-full rounded object-cover"
                  />
                )}
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="text-lg font-bold">{project.name}</h4>
                  {project.featured && (
                    <span className="inline-flex items-center gap-1 tint-5 rounded border border-t-border bg-t-bg px-1.5 py-0.5 text-xs font-medium text-t-fg">
                      <Star size={12} /> Featured
                    </span>
                  )}
                </div>
                <p className="mb-2 font-mono text-xs text-muted">/projects/{project.slug}</p>
                <p className="mb-2 truncate text-sm text-muted">{project.description}</p>
                <div className="mb-4 flex flex-wrap gap-1">
                  {project.mainTechStack.map((tech, i) => (
                    <span
                      key={`${tech}-${i}`}
                      className="rounded bg-bg-2 px-2 py-1 text-xs text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t pt-3">
                <ReorderButtons
                  label={project.name}
                  index={index}
                  count={projects.length}
                  disabled={reordering}
                  onMove={(delta) => handleMove(index, delta)}
                />
                <button
                  type="button"
                  onClick={() => handleEditClick(project)}
                  className="flex items-center gap-1 text-sm text-accent hover:opacity-80"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === project.id}
                  onClick={() => handleDelete(project)}
                  className="flex items-center gap-1 text-sm text-danger hover:opacity-80 disabled:opacity-50"
                >
                  <Trash2 size={14} /> {deletingId === project.id ? "Deleting..." : "Delete"}
                </button>
                <Link
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-sm text-muted hover:text-fg"
                >
                  <ExternalLink size={14} /> View
                </Link>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-muted">No projects added yet.</p>}
        </div>
      </div>
    </div>
  );
}
