
"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  BriefcaseBusiness,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const emptyCompany = {
  name: "",
  description: "",
  website: "",
};

const emptyOpportunity = {
  title: "",
  description: "",
  location: "",
  opportunity_type: "Internship",
  deadline: "",
  application_url: "",
  status: "published",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1019] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]";

const types = ["Internship", "Job", "Project", "Mentorship"];

function formatDate(value) {
  if (!value) return "No deadline";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function validWebUrl(value) {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(value.trim());
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function EmployerOpportunitiesPage() {
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [skills, setSkills] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [requiredSkillIds, setRequiredSkillIds] = useState([]);
  const [form, setForm] = useState(emptyOpportunity);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      const [companyResult, skillsResult] = await Promise.all([
        supabase
          .from("companies")
          .select("id, employer_id, name, description, website, logo_url")
          .eq("employer_id", user.id)
          .maybeSingle(),

        supabase
          .from("skills")
          .select("id, name, category")
          .order("name"),
      ]);

      if (!active) return;

      if (companyResult.error || skillsResult.error) {
        setErrorMessage(
          companyResult.error?.message ||
            skillsResult.error?.message
        );
        setLoading(false);
        return;
      }

      const savedCompany = companyResult.data;

      setCompany(savedCompany);
      setSkills(skillsResult.data || []);

      if (savedCompany) {
        setCompanyForm({
          name: savedCompany.name || "",
          description: savedCompany.description || "",
          website: savedCompany.website || "",
        });

        const opportunityResult = await supabase
          .from("opportunities")
          .select(
            "id, company_id, title, description, location, opportunity_type, deadline, application_url, status, created_at"
          )
          .eq("company_id", savedCompany.id)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (opportunityResult.error) {
          setErrorMessage(opportunityResult.error.message);
        } else {
          const listingData = opportunityResult.data || [];

          const linksResult = listingData.length
            ? await supabase
                .from("opportunity_skills")
                .select("opportunity_id, skill_id")
                .in(
                  "opportunity_id",
                  listingData.map((item) => item.id)
                )
            : { data: [], error: null };

          if (!active) return;

          if (linksResult.error) {
            setErrorMessage(linksResult.error.message);
          } else {
            const links = linksResult.data || [];

            setOpportunities(
              listingData.map((item) => ({
                ...item,
                requiredSkillIds: links
                  .filter((link) => link.opportunity_id === item.id)
                  .map((link) => link.skill_id),
              }))
            );
          }
        }
      }

      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.id]);

  function updateCompanyField(event) {
    const { name, value } = event.target;

    setCompanyForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateOpportunityField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveCompany(event) {
    event.preventDefault();

    if (!user?.id) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!validWebUrl(companyForm.website)) {
      setErrorMessage("Enter a valid company website URL.");
      return;
    }

    setSavingCompany(true);

    const payload = {
      employer_id: user.id,
      name: companyForm.name.trim(),
      description: companyForm.description.trim() || null,
      website: companyForm.website.trim() || null,
    };

    let result;

    if (company) {
      result = await supabase
        .from("companies")
        .update({
          name: payload.name,
          description: payload.description,
          website: payload.website,
        })
        .eq("id", company.id)
        .eq("employer_id", user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("companies")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setCompany(result.data);
      setCompanyForm({
        name: result.data.name || "",
        description: result.data.description || "",
        website: result.data.website || "",
      });
      setShowCompanyForm(false);
      setSuccessMessage("Company profile saved successfully.");
    }

    setSavingCompany(false);
  }

  function openNewOpportunity() {
    setForm(emptyOpportunity);
    setRequiredSkillIds([]);
    setEditingId(null);
    setShowOpportunityForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openEditOpportunity(opportunity) {
    setForm({
      title: opportunity.title || "",
      description: opportunity.description || "",
      location: opportunity.location || "",
      opportunity_type: opportunity.opportunity_type || "Internship",
      deadline: opportunity.deadline || "",
      application_url: opportunity.application_url || "",
      status: opportunity.status || "published",
    });

    setRequiredSkillIds(opportunity.requiredSkillIds || []);
    setEditingId(opportunity.id);
    setShowOpportunityForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeOpportunityForm() {
    setShowOpportunityForm(false);
    setEditingId(null);
    setForm(emptyOpportunity);
    setRequiredSkillIds([]);
  }

  function toggleRequiredSkill(skillId) {
    setRequiredSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  async function saveOpportunity(event) {
    event.preventDefault();

    if (!user?.id || !company?.id) {
      setErrorMessage("Save your company profile before posting.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !validWebUrl(form.application_url)
    ) {
      setErrorMessage("Enter a valid application URL.");
      return;
    }

    if (
      form.deadline &&
      form.deadline < new Date().toISOString().slice(0, 10)
    ) {
      setErrorMessage("The deadline cannot be in the past.");
      return;
    }

    setSavingOpportunity(true);

    const payload = {
      company_id: company.id,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim() || null,
      opportunity_type: form.opportunity_type,
      deadline: form.deadline || null,
      application_url: form.application_url.trim() || null,
      status: form.status,
    };

    let result;

    if (editingId !== null) {
      result = await supabase
        .from("opportunities")
        .update(payload)
        .eq("id", editingId)
        .eq("company_id", company.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("opportunities")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setErrorMessage(result.error.message);
      setSavingOpportunity(false);
      return;
    }

    const savedOpportunity = result.data;

    // Replace the required skill links for this opportunity.
    const deleteResult = await supabase
      .from("opportunity_skills")
      .delete()
      .eq("opportunity_id", savedOpportunity.id);

    if (deleteResult.error) {
      setErrorMessage(
        "The opportunity was saved, but its previous skill links could not be updated: " +
          deleteResult.error.message
      );
      setSavingOpportunity(false);
      return;
    }

    if (requiredSkillIds.length > 0) {
      const linkRows = requiredSkillIds.map((skillId) => ({
        opportunity_id: savedOpportunity.id,
        skill_id: skillId,
      }));

      const insertLinksResult = await supabase
        .from("opportunity_skills")
        .insert(linkRows);

      if (insertLinksResult.error) {
        setErrorMessage(
          "The opportunity was saved, but some required skills could not be saved: " +
            insertLinksResult.error.message
        );
        setSavingOpportunity(false);
        return;
      }
    }

    const savedWithSkills = {
      ...savedOpportunity,
      requiredSkillIds,
    };

    if (editingId !== null) {
      setOpportunities((current) =>
        current.map((item) =>
          item.id === editingId ? savedWithSkills : item
        )
      );
      setSuccessMessage("Opportunity updated successfully.");
    } else {
      setOpportunities((current) => [
        savedWithSkills,
        ...current,
      ]);
      setSuccessMessage(
        form.status === "published"
          ? "Opportunity published successfully."
          : "Opportunity saved as a draft."
      );
    }

    closeOpportunityForm();
    setSavingOpportunity(false);
  }

  async function deleteOpportunity(opportunity) {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}"? Applications linked to this opportunity may also be deleted because of your database's foreign-key settings.`
    );

    if (!confirmed || !company?.id) return;

    setDeletingId(opportunity.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", opportunity.id)
      .eq("company_id", company.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setOpportunities((current) =>
        current.filter((item) => item.id !== opportunity.id)
      );
      setSuccessMessage("Opportunity deleted.");
    }

    setDeletingId(null);
  }

  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <DashboardLayout role="employer">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#f5c451]">
                EMPLOYER WORKSPACE
              </p>

              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                My Opportunities
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                Manage your company profile and connect with students
                who can contribute to your organisation.
              </p>
            </div>

            <button
              type="button"
              disabled={!company}
              onClick={openNewOpportunity}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Post opportunity
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#111722] p-8 text-sm text-gray-400">
              Loading employer workspace...
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#f5c451]/10 p-3 text-[#f5c451]">
                      <Building2 size={24} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Company profile
                      </h2>

                      <p className="mt-1 text-sm text-gray-400">
                        {company
                          ? "Your company details are ready to use in opportunity listings."
                          : "Set up your company before posting opportunities."}
                      </p>

                      {company && (
                        <div className="mt-4">
                          <p className="font-semibold text-white">
                            {company.name}
                          </p>

                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm text-[#f5c451] hover:text-[#ffda78]"
                            >
                              Visit website
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCompanyForm((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:border-[#f5c451]/40 hover:text-[#f5c451]"
                  >
                    <Pencil size={15} />
                    {company ? "Edit company" : "Set up company"}
                  </button>
                </div>

                {showCompanyForm && (
                  <form
                    onSubmit={saveCompany}
                    className="mt-7 space-y-5 border-t border-white/10 pt-7"
                  >
                    <div>
                      <label
                        htmlFor="company-name"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Company name
                      </label>

                      <input
                        id="company-name"
                        name="name"
                        value={companyForm.name}
                        onChange={updateCompanyField}
                        className={inputClass}
                        placeholder="e.g. Bright Future Technologies"
                        maxLength={150}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="company-description"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Company description
                      </label>

                      <textarea
                        id="company-description"
                        name="description"
                        value={companyForm.description}
                        onChange={updateCompanyField}
                        className={inputClass}
                        placeholder="Describe your organisation and what it does..."
                        rows={4}
                        maxLength={2000}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="company-website"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Company website
                      </label>

                      <input
                        id="company-website"
                        name="website"
                        type="url"
                        value={companyForm.website}
                        onChange={updateCompanyField}
                        className={inputClass}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCompanyForm(false)}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingCompany}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] disabled:opacity-50"
                      >
                        <Save size={16} />
                        {savingCompany ? "Saving..." : "Save company"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {showOpportunityForm && (
                <section className="rounded-2xl border border-[#f5c451]/20 bg-[#111722] p-6 sm:p-8">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {editingId !== null
                          ? "Edit opportunity"
                          : "Create an opportunity"}
                      </h2>

                      <p className="mt-2 text-sm text-gray-400">
                        Provide accurate details so students can decide
                        whether to apply.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeOpportunityForm}
                      aria-label="Close opportunity form"
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={saveOpportunity} className="space-y-5">
                    <div>
                      <label
                        htmlFor="opportunity-title"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Opportunity title
                      </label>

                      <input
                        id="opportunity-title"
                        name="title"
                        value={form.title}
                        onChange={updateOpportunityField}
                        className={inputClass}
                        placeholder="e.g. Frontend Developer Intern"
                        maxLength={180}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="opportunity-description"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Description and requirements
                      </label>

                      <textarea
                        id="opportunity-description"
                        name="description"
                        value={form.description}
                        onChange={updateOpportunityField}
                        className={inputClass}
                        placeholder="Describe the role, responsibilities, qualifications, and what the student will gain..."
                        rows={6}
                        maxLength={5000}
                        required
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="opportunity-type"
                          className="mb-2 block text-sm text-gray-300"
                        >
                          Opportunity type
                        </label>

                        <select
                          id="opportunity-type"
                          name="opportunity_type"
                          value={form.opportunity_type}
                          onChange={updateOpportunityField}
                          className={inputClass}
                        >
                          {types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="opportunity-location"
                          className="mb-2 block text-sm text-gray-300"
                        >
                          Location or work arrangement
                        </label>

                        <input
                          id="opportunity-location"
                          name="location"
                          value={form.location}
                          onChange={updateOpportunityField}
                          className={inputClass}
                          placeholder="e.g. Nairobi / Remote"
                          maxLength={150}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="opportunity-deadline"
                          className="mb-2 block text-sm text-gray-300"
                        >
                          Application deadline
                        </label>

                        <input
                          id="opportunity-deadline"
                          name="deadline"
                          type="date"
                          value={form.deadline}
                          onChange={updateOpportunityField}
                          className={inputClass}
                          min={new Date().toISOString().slice(0, 10)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="opportunity-application-url"
                          className="mb-2 block text-sm text-gray-300"
                        >
                          External application link (optional)
                        </label>

                        <input
                          id="opportunity-application-url"
                          name="application_url"
                          type="url"
                          value={form.application_url}
                          onChange={updateOpportunityField}
                          className={inputClass}
                          placeholder="https://example.com/apply"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-300">
                        Required skills
                      </h3>

                      <p className="mb-4 text-xs text-gray-500">
                        Select all skills relevant to this opportunity.
                      </p>

                      {skills.length === 0 ? (
                        <p className="rounded-xl border border-white/10 p-4 text-sm text-gray-400">
                          No skills are available yet. Add skills in
                          the Supabase skills table first.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {skills.map((skill) => {
                            const checked = requiredSkillIds.includes(
                              skill.id
                            );

                            return (
                              <label
                                key={skill.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                                  checked
                                    ? "border-[#f5c451]/50 bg-[#f5c451]/10 text-white"
                                    : "border-white/10 bg-[#0b1019] text-gray-300 hover:border-white/20"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleRequiredSkill(skill.id)
                                  }
                                  className="accent-[#f5c451]"
                                />

                                <span>{skill.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="opportunity-status"
                        className="mb-2 block text-sm text-gray-300"
                      >
                        Listing status
                      </label>

                      <select
                        id="opportunity-status"
                        name="status"
                        value={form.status}
                        onChange={updateOpportunityField}
                        className={inputClass}
                      >
                        <option value="draft">Save as draft</option>
                        <option value="published">
                          Publish to students
                        </option>
                      </select>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeOpportunityForm}
                        className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingOpportunity}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] disabled:opacity-50"
                      >
                        <Save size={16} />
                        {savingOpportunity
                          ? "Saving..."
                          : form.status === "published"
                            ? "Publish opportunity"
                            : "Save draft"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Your listings
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      Manage the opportunities posted by your company.
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                    {opportunities.length} total
                  </span>
                </div>

                {!company ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#111722] p-8 text-center">
                    <Building2
                      size={30}
                      className="mx-auto mb-3 text-[#f5c451]"
                    />

                    <h3 className="font-semibold text-white">
                      Set up your company first
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                      Add your company name and details to start
                      publishing opportunities for students.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowCompanyForm(true)}
                      className="mt-5 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12]"
                    >
                      Set up company
                    </button>
                  </div>
                ) : opportunities.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#111722] p-10 text-center">
                    <BriefcaseBusiness
                      size={30}
                      className="mx-auto mb-3 text-[#f5c451]"
                    />

                    <h3 className="font-semibold text-white">
                      No opportunities yet
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      Create your first listing to start reaching students.
                    </p>

                    <button
                      type="button"
                      onClick={openNewOpportunity}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12]"
                    >
                      <Plus size={17} />
                      Create opportunity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunities.map((opportunity) => (
                      <article
                        key={opportunity.id}
                        className="rounded-2xl border border-white/10 bg-[#111722] p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5c451]/10 text-[#f5c451] sm:flex">
                              <BriefcaseBusiness size={23} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="break-words font-semibold text-white">
                                  {opportunity.title}
                                </h3>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs ${
                                    opportunity.status === "published"
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : "bg-amber-500/10 text-amber-300"
                                  }`}
                                >
                                  {opportunity.status === "published"
                                    ? "Published"
                                    : "Draft"}
                                </span>
                              </div>

                              <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-400">
                                {opportunity.description}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                                <span className="inline-flex items-center gap-1.5">
                                  <BriefcaseBusiness size={14} />
                                  {opportunity.opportunity_type}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin size={14} />
                                  {opportunity.location || "Location flexible"}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays size={14} />
                                  {formatDate(opportunity.deadline)}
                                </span>
                              </div>

                              {opportunity.requiredSkillIds.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {skills
                                    .filter((skill) =>
                                      opportunity.requiredSkillIds.includes(
                                        skill.id
                                      )
                                    )
                                    .map((skill) => (
                                      <span
                                        key={skill.id}
                                        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-300"
                                      >
                                        {skill.name}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openEditOpportunity(opportunity)
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-[#f5c451]/40 hover:text-[#f5c451]"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteOpportunity(opportunity)
                              }
                              disabled={deletingId === opportunity.id}
                              aria-label={`Delete ${opportunity.title}`}
                              className="rounded-lg border border-white/10 p-2 text-gray-400 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
