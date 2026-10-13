
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FolderKanban,
  GitBranch,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  Save,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const emptyForm = {
  title: "",
  description: "",
  project_url: "",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1019] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]";

function isValidUrl(value) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function StudentProjectsPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function loadProjects() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, description, project_url, created_at"
        )
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [user?.id]);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openEditForm(project) {
    setForm({
      title: project.title || "",
      description: project.description || "",
      project_url: project.project_url || "",
    });

    setEditingId(project.id);
    setShowForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveProject(event) {
    event.preventDefault();

    if (!user?.id) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const projectUrl = form.project_url.trim();

    if (!isValidUrl(projectUrl)) {
      setErrorMessage(
        "Enter a valid link starting with https:// or http://."
      );
      setSaving(false);
      return;
    }

    const projectData = {
      title: form.title.trim(),
      description: form.description.trim(),
      project_url: projectUrl || null,
    };

    let result;

    if (editingId !== null) {
      result = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", editingId)
        .eq("student_id", user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("projects")
        .insert({
          ...projectData,
          student_id: user.id,
        })
        .select()
        .single();
    }

    if (result.error) {
      setErrorMessage(result.error.message);
      setSaving(false);
      return;
    }

    if (editingId !== null) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingId ? result.data : project
        )
      );
      setSuccessMessage("Project updated successfully.");
    } else {
      setProjects((current) => [result.data, ...current]);
      setSuccessMessage("Project added successfully.");
    }

    closeForm();
    setSaving(false);
  }

  async function deleteProject(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"?`
    );

    if (!confirmed || !user?.id) return;

    setDeletingId(project.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)
      .eq("student_id", user.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
      setSuccessMessage("Project deleted successfully.");
    }

    setDeletingId(null);
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout role="student">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#f5c451]">
                SHOW WHAT YOU CAN BUILD
              </p>

              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                My Projects
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                Showcase your practical experience. Add projects,
                explain what you built, and share your work with
                potential employers.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78]"
            >
              <Plus size={18} />
              Add project
            </button>
          </div>

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {showForm && (
            <section className="rounded-2xl border border-[#f5c451]/20 bg-[#111722] p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingId !== null
                      ? "Edit project"
                      : "Add a new project"}
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Include enough detail for someone to understand
                    the problem your project solves.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close project form"
                  className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveProject} className="space-y-5">
                <div>
                  <label
                    htmlFor="project-title"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Project title
                  </label>

                  <input
                    id="project-title"
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Student Opportunity Platform"
                    required
                    maxLength={150}
                  />
                </div>

                <div>
                  <label
                    htmlFor="project-description"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Project description
                  </label>

                  <textarea
                    id="project-description"
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="What does it do? Which technologies did you use? What did you learn?"
                    rows={5}
                    required
                    maxLength={3000}
                  />

                  <p className="mt-2 text-right text-xs text-gray-500">
                    {form.description.length}/3000 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="project-url"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    GitHub repository or live demo URL
                  </label>

                  <input
                    id="project-url"
                    name="project_url"
                    type="url"
                    value={form.project_url}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="https://github.com/your-username/project"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Optional. Use a public GitHub repository or a
                    deployed project URL.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78] disabled:opacity-50"
                  >
                    <Save size={17} />
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Save changes"
                        : "Save project"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Your portfolio
            </h2>

            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
              {projects.length}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#111722] p-10 text-center text-sm text-gray-400">
              Loading your projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#111722]/60 px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5c451]/10 text-[#f5c451]">
                <FolderKanban size={30} />
              </div>

              <h3 className="text-lg font-semibold text-white">
                Your portfolio starts here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                Add a project you have built for class, personal
                learning, an internship, or a client.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78]"
              >
                <Plus size={18} />
                Add your first project
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#111722] p-6 transition hover:border-[#f5c451]/30"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-[#f5c451]/10 p-3 text-[#f5c451]">
                      <FolderKanban size={23} />
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(project)}
                        title="Edit project"
                        aria-label={`Edit ${project.title}`}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-[#f5c451]"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProject(project)}
                        disabled={deletingId === project.id}
                        title="Delete project"
                        aria-label={`Delete ${project.title}`}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white">
                    {project.title}
                  </h3>

                  <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-400">
                    {project.description}
                  </p>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    {project.project_url ? (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#f5c451] transition hover:text-[#ffda78]"
                      >
                        {project.project_url.includes("github.com") ? (
                          <Github size={17} />
                        ) : (
                          <ExternalLink size={17} />
                        )}
                        View project
                        <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No project link added
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0d121c] p-6 sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">
                Make your profile stand out
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Keep your skills and personal information up to date.
              </p>
            </div>

            <Link
              href="/student/profile"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#f5c451] hover:text-[#ffda78] sm:mt-0"
            >
              Update profile
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
