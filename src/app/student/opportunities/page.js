
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  ArrowUpRight,
  X,
  CheckCircle2,
  Clock3,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1019] px-4 py-3 text-sm text-white outline-none focus:border-[#f5c451]";

const opportunityTypes = [
  "All types",
  "Internship",
  "Job",
  "Project",
  "Mentorship",
];

function formatDate(value) {
  if (!value) return "No deadline specified";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function isExpired(deadline) {
  if (!deadline) return false;

  return deadline < new Date().toISOString().slice(0, 10);
}

function getTypeLabel(type) {
  if (!type) return "Opportunity";

  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export default function StudentOpportunitiesPage() {
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function loadMarketplace() {
      setLoading(true);
      setErrorMessage("");

      const [
        opportunitiesResult,
        companiesResult,
        opportunitySkillsResult,
        skillsResult,
        applicationsResult,
      ] = await Promise.all([
        supabase
          .from("opportunities")
          .select(
            "id, title, description, location, opportunity_type, deadline, application_url, company_id, created_at, status"
          )
          .eq("status", "published")
          
          .order("created_at", { ascending: false }),

        supabase
          .from("companies")
          .select("id, name, description, website, logo_url"),

        supabase
          .from("opportunity_skills")
          .select("opportunity_id, skill_id"),

        supabase
          .from("skills")
          .select("id, name, category"),

        supabase
          .from("applications")
          .select("id, opportunity_id, status, applied_at")
          .eq("student_id", user.id),
      ]);

      if (!active) return;

      const results = [
        opportunitiesResult,
        companiesResult,
        opportunitySkillsResult,
        skillsResult,
        applicationsResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        setErrorMessage(failedResult.error.message);
        setLoading(false);
        return;
      }

      const companies = companiesResult.data || [];
      const skillLinks = opportunitySkillsResult.data || [];
      const skills = skillsResult.data || [];

      const companyById = new Map(
        companies.map((company) => [company.id, company])
      );

      const skillsByOpportunity = new Map();

      for (const link of skillLinks) {
        const skill = skills.find(
          (item) => item.id === link.skill_id
        );

        if (!skill) continue;

        if (!skillsByOpportunity.has(link.opportunity_id)) {
          skillsByOpportunity.set(link.opportunity_id, []);
        }

        skillsByOpportunity.get(link.opportunity_id).push(skill);
      }

      const mappedOpportunities = (
        opportunitiesResult.data || []
      )
        .filter((item) => !isExpired(item.deadline))
        .map((item) => ({
          ...item,
          company: companyById.get(item.company_id) || null,
          requiredSkills:
            skillsByOpportunity.get(item.id) || [],
        }));

      setOpportunities(mappedOpportunities);
      setApplications(applicationsResult.data || []);
      setLoading(false);
    }

    loadMarketplace();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const appliedOpportunityIds = useMemo(
    () => new Set(applications.map((item) => item.opportunity_id)),
    [applications]
  );

  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase();
    const locationTerm = locationFilter.trim().toLowerCase();

    return opportunities.filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.company?.name,
        ...(item.requiredSkills || []).map((skill) => skill.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesType =
        typeFilter === "All types" ||
        getTypeLabel(item.opportunity_type).toLowerCase() ===
          typeFilter.toLowerCase();

      const matchesLocation =
        !locationTerm ||
        (item.location || "").toLowerCase().includes(locationTerm);

      return matchesSearch && matchesType && matchesLocation;
    });
  }, [opportunities, search, typeFilter, locationFilter]);

  async function applyToOpportunity(opportunity) {
    if (!user?.id) return;

    if (appliedOpportunityIds.has(opportunity.id)) {
      setErrorMessage("You have already applied for this opportunity.");
      return;
    }

    if (isExpired(opportunity.deadline)) {
      setErrorMessage("The deadline for this opportunity has passed.");
      return;
    }

    setApplyingId(opportunity.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("applications")
      .insert({
        student_id: user.id,
        opportunity_id: opportunity.id,
      })
      .select("id, opportunity_id, status, applied_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("You have already applied for this opportunity.");
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setApplications((current) => [...current, data]);
      setSuccessMessage(
        `Your application for "${opportunity.title}" has been submitted.`
      );
      setSelectedOpportunity(null);
    }

    setApplyingId(null);
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout role="student">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111722] p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#f5c451]/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f5c451]/20 bg-[#f5c451]/10 px-3 py-1.5 text-xs font-medium text-[#f5c451]">
                <Sparkles size={14} />
                YOUR NEXT OPPORTUNITY STARTS HERE
              </div>

              <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
                Find opportunities.
                <span className="block text-[#f5c451]">
                  Build your future.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                Discover internships, jobs, projects, and mentorship
                opportunities that help you turn your skills into
                real-world experience.
              </p>

              <div className="mt-7 flex flex-wrap gap-5 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness
                    size={17}
                    className="text-[#f5c451]"
                  />
                  {opportunities.length} available opportunities
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-[#f5c451]"
                  />
                  Track your applications
                </span>
              </div>
            </div>
          </section>

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

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Explore opportunities
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Search and filter to find a suitable opportunity.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111722] p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  className={`${inputClass} pl-11`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, company, or skill..."
                  aria-label="Search opportunities"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <select
                  className={`${inputClass} pl-9`}
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value)
                  }
                  aria-label="Filter by opportunity type"
                >
                  {opportunityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <input
                className={inputClass}
                value={locationFilter}
                onChange={(event) =>
                  setLocationFilter(event.target.value)
                }
                placeholder="Filter by location"
                aria-label="Filter by location"
              />
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">
                {search || locationFilter || typeFilter !== "All types"
                  ? "Search results"
                  : "Latest opportunities"}
              </h2>

              <span className="text-sm text-gray-500">
                {filteredOpportunities.length} found
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#111722] p-10 text-center text-sm text-gray-400">
                Loading opportunities...
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#111722]/60 px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5c451]/10 text-[#f5c451]">
                  <BriefcaseBusiness size={29} />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  No opportunities found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                  Try different search terms or filters. If this is
                  your first setup, opportunities will appear here
                  after an employer adds them.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("All types");
                    setLocationFilter("");
                  }}
                  className="mt-5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredOpportunities.map((opportunity) => {
                  const applied = appliedOpportunityIds.has(
                    opportunity.id
                  );

                  return (
                    <article
                      key={opportunity.id}
                      className="flex flex-col rounded-2xl border border-white/10 bg-[#111722] p-6 transition hover:border-[#f5c451]/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0b1019] text-[#f5c451]">
                            <BriefcaseBusiness size={22} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-semibold text-white">
                              {opportunity.title}
                            </h3>

                            <p className="mt-1 text-sm text-gray-400">
                              {opportunity.company?.name ||
                                "Company details unavailable"}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-[#f5c451]/20 bg-[#f5c451]/10 px-3 py-1 text-xs text-[#f5c451]">
                          {getTypeLabel(
                            opportunity.opportunity_type
                          )}
                        </span>
                      </div>

                      <p className="mt-5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-400">
                        {opportunity.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-gray-400">
                        <span className="flex items-center gap-2">
                          <MapPin size={15} className="text-[#f5c451]" />
                          {opportunity.location || "Location not specified"}
                        </span>

                        <span className="flex items-center gap-2">
                          <CalendarDays
                            size={15}
                            className="text-[#f5c451]"
                          />
                          {opportunity.deadline
                            ? `Deadline: ${formatDate(opportunity.deadline)}`
                            : "Flexible deadline"}
                        </span>
                      </div>

                      {opportunity.requiredSkills.length > 0 && (
                        <div className="mt-5">
                          <p className="mb-2 text-xs font-medium text-gray-400">
                            REQUIRED SKILLS
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {opportunity.requiredSkills
                              .slice(0, 5)
                              .map((skill) => (
                                <span
                                  key={skill.id}
                                  className="rounded-lg border border-white/10 bg-[#0b1019] px-2.5 py-1.5 text-xs text-gray-300"
                                >
                                  {skill.name}
                                </span>
                              ))}

                            {opportunity.requiredSkills.length > 5 && (
                              <span className="px-2 py-1.5 text-xs text-gray-500">
                                +{opportunity.requiredSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 mt-6">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOpportunity(opportunity)
                          }
                          className="text-sm font-medium text-gray-300 transition hover:text-[#f5c451]"
                        >
                          View details
                        </button>

                        <button
                          type="button"
                          disabled={applied || applyingId === opportunity.id}
                          onClick={() =>
                            applyToOpportunity(opportunity)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-4 py-2.5 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {applied ? (
                            <>
                              <CheckCircle2 size={16} />
                              Applied
                            </>
                          ) : applyingId === opportunity.id ? (
                            "Submitting..."
                          ) : (
                            <>
                              Apply now
                              <ArrowUpRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-[#f5c451]/15 bg-[#111722] p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-[#f5c451]/10 p-3 text-[#f5c451]">
                <Clock3 size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Keep your profile ready
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Employers need to understand your skills and practical
                  experience. Keep your profile and projects up to date
                  before applying.
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedOpportunity && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedOpportunity(null);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="opportunity-dialog-title"
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded-full border border-[#f5c451]/20 bg-[#f5c451]/10 px-3 py-1 text-xs text-[#f5c451]">
                    {getTypeLabel(
                      selectedOpportunity.opportunity_type
                    )}
                  </span>

                  <h2
                    id="opportunity-dialog-title"
                    className="mt-4 text-2xl font-bold text-white"
                  >
                    {selectedOpportunity.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    {selectedOpportunity.company?.name ||
                      "Company details unavailable"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOpportunity(null)}
                  aria-label="Close details"
                  className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#f5c451]" />
                  {selectedOpportunity.location ||
                    "Location not specified"}
                </span>

                <span className="flex items-center gap-2">
                  <CalendarDays
                    size={16}
                    className="text-[#f5c451]"
                  />
                  {selectedOpportunity.deadline
                    ? formatDate(selectedOpportunity.deadline)
                    : "Flexible deadline"}
                </span>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-white">
                  About this opportunity
                </h3>

                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                  {selectedOpportunity.description}
                </p>
              </div>

              <div className="mt-7">
                <h3 className="mb-3 font-semibold text-white">
                  Required skills
                </h3>

                {selectedOpportunity.requiredSkills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedOpportunity.requiredSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-lg border border-white/10 bg-[#0b1019] px-3 py-2 text-sm text-gray-300"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No specific skills have been listed.
                  </p>
                )}
              </div>

              {selectedOpportunity.company?.description && (
                <div className="mt-7">
                  <h3 className="mb-3 font-semibold text-white">
                    About the company
                  </h3>

                  <p className="text-sm leading-6 text-gray-400">
                    {selectedOpportunity.company.description}
                  </p>
                </div>
              )}

              {selectedOpportunity.company?.website && (
                <a
                  href={selectedOpportunity.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm text-[#f5c451] hover:text-[#ffda78]"
                >
                  Visit company website
                  <ArrowUpRight size={16} />
                </a>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOpportunity(null)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={
                    appliedOpportunityIds.has(selectedOpportunity.id) ||
                    applyingId === selectedOpportunity.id
                  }
                  onClick={() =>
                    applyToOpportunity(selectedOpportunity)
                  }
                  className="rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] hover:bg-[#ffda78] disabled:opacity-50"
                >
                  {appliedOpportunityIds.has(selectedOpportunity.id)
                    ? "Already applied"
                    : applyingId === selectedOpportunity.id
                      ? "Submitting..."
                      : "Submit application"}
                </button>
              </div>
            </section>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
