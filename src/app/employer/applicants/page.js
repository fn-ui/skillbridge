"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  UserRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const statusOptions = [
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const statusStyles = {
  applied: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  shortlisted: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
};

function formatDate(value) {
  if (!value) return "Unavailable";

  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EmployerApplicantsContent() {
  const { user } = useAuth();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [opportunityFilter, setOpportunityFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplicants = useCallback(async () => {
    if (!user?.id) {
      setApplicants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // Find the company owned by this employer.
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("employer_id", user.id)
      .maybeSingle();

    if (companyError) {
      console.error("Company lookup failed:", companyError);
      setError("Could not load your company. Please try again.");
      setApplicants([]);
      setLoading(false);
      return;
    }

    if (!company) {
      setApplicants([]);
      setLoading(false);
      return;
    }

    // Fetch only this company's opportunities.
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from("opportunities")
      .select("id, title, location, opportunity_type")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (opportunitiesError) {
      console.error("Opportunity lookup failed:", opportunitiesError);
      setError("Could not load your opportunities.");
      setApplicants([]);
      setLoading(false);
      return;
    }

    if (!opportunities?.length) {
      setApplicants([]);
      setLoading(false);
      return;
    }

    const opportunityIds = opportunities.map((item) => item.id);

    // The application SELECT policy limits employers to their own opportunities.
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("id, student_id, opportunity_id, status, applied_at")
      .in("opportunity_id", opportunityIds)
      .order("applied_at", { ascending: false });

    if (applicationsError) {
      console.error("Application lookup failed:", applicationsError);
      setError("Could not load applications. Check your database policies.");
      setApplicants([]);
      setLoading(false);
      return;
    }

    const studentIds = [
      ...new Set((applications || []).map((item) => item.student_id)),
    ];

    let profiles = [];

    if (studentIds.length > 0) {
      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, bio, location, profile_image")
        .in("user_id", studentIds);

      if (profilesError) {
        console.error("Applicant profile lookup failed:", profilesError);
        setError(
          "Applications loaded, but applicant profiles could not be retrieved. Check the profiles SELECT policy."
        );
        setApplicants([]);
        setLoading(false);
        return;
      }

      profiles = profileData || [];
    }

    const profileByUserId = Object.fromEntries(
      profiles.map((profile) => [profile.user_id, profile])
    );

    const opportunityById = Object.fromEntries(
      opportunities.map((opportunity) => [opportunity.id, opportunity])
    );

    const combined = (applications || []).map((application) => ({
      ...application,
      student: profileByUserId[application.student_id] || null,
      opportunity: opportunityById[application.opportunity_id] || null,
    }));

    setApplicants(combined);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  async function updateApplicationStatus(applicationId, newStatus) {
    setUpdatingId(applicationId);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId)
      .select("id")
      .single();

    if (updateError) {
      console.error("Application status update failed:", updateError);
      setError(
        "Could not update this application. Confirm your employer permissions and try again."
      );
      setUpdatingId(null);
      return;
    }

    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === applicationId
          ? { ...applicant, status: newStatus }
          : applicant
      )
    );

    setSuccess("Application status updated.");
    setUpdatingId(null);
  }

  const opportunityOptions = [
    ...new Map(
      applicants
        .filter((item) => item.opportunity)
        .map((item) => [
          item.opportunity.id,
          {
            id: item.opportunity.id,
            title: item.opportunity.title,
          },
        ])
    ).values(),
  ];

  const filteredApplicants = applicants.filter((applicant) => {
    const name = applicant.student?.full_name || "Student";
    const title = applicant.opportunity?.title || "";
    const location = applicant.student?.location || "";

    const matchesSearch = `${name} ${title} ${location}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || applicant.status === statusFilter;

    const matchesOpportunity =
      opportunityFilter === "all" ||
      String(applicant.opportunity_id) === opportunityFilter;

    return matchesSearch && matchesStatus && matchesOpportunity;
  });

  const counts = {
    all: applicants.length,
    applied: applicants.filter((item) => item.status === "applied").length,
    reviewing: applicants.filter((item) => item.status === "reviewing").length,
    shortlisted: applicants.filter((item) => item.status === "shortlisted").length,
    accepted: applicants.filter((item) => item.status === "accepted").length,
    rejected: applicants.filter((item) => item.status === "rejected").length,
  };

  return (
    <div className="min-h-screen space-y-8 bg-[#080B12] p-4 text-white sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-amber-400">
            TALENT MANAGEMENT
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Applicants
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review applications submitted to your company's opportunities.
          </p>
        </div>

        <button
          onClick={loadApplicants}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { key: "all", label: "All applicants", value: counts.all },
          { key: "applied", label: "New", value: counts.applied },
          { key: "reviewing", label: "Reviewing", value: counts.reviewing },
          { key: "shortlisted", label: "Shortlisted", value: counts.shortlisted },
          { key: "accepted", label: "Accepted", value: counts.accepted },
          { key: "rejected", label: "Rejected", value: counts.rejected },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`rounded-2xl border p-4 text-left transition ${
              statusFilter === item.key
                ? "border-amber-400/50 bg-amber-400/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search applicants or opportunities..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400/50"
          />
        </div>

        <select
          value={opportunityFilter}
          onChange={(event) => setOpportunityFilter(event.target.value)}
          className="rounded-xl border border-white/10 bg-[#10141E] px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50"
        >
          <option value="all">All opportunities</option>
          {opportunityOptions.map((opportunity) => (
            <option key={opportunity.id} value={String(opportunity.id)}>
              {opportunity.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              onClick={loadApplicants}
              className="mt-2 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">
          Loading applicants...
        </div>
      ) : !error && filteredApplicants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
          <Users className="mx-auto text-amber-400" size={36} />
          <h2 className="mt-4 text-lg font-semibold">
            {applicants.length === 0
              ? "No applicants yet"
              : "No matching applicants"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {applicants.length === 0
              ? "Applications will appear here when students apply to your opportunities."
              : "Try another search, status, or opportunity filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplicants.map((applicant) => {
            const student = applicant.student;
            const opportunity = applicant.opportunity;
            const currentStatus = applicant.status || "applied";

            return (
              <article
                key={applicant.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-400/25 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-amber-400/10">
                      {student?.profile_image ? (
                        <img
                          src={student.profile_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="text-amber-300" size={24} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold">
                        {student?.full_name || "Student profile unavailable"}
                      </h2>

                      {student?.location && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                          <MapPin size={14} />
                          {student.location}
                        </p>
                      )}

                      <p className="mt-3 text-sm font-medium text-amber-300">
                        {opportunity?.title || "Opportunity"}
                      </p>

                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          Applied {formatDate(applicant.applied_at)}
                        </span>

                        {opportunity?.opportunity_type && (
                          <span className="inline-flex items-center gap-1.5">
                            <BriefcaseBusiness size={13} />
                            {opportunity.opportunity_type}
                          </span>
                        )}
                      </p>

                      {student?.bio && (
                        <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-slate-400">
                          {student.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-48">
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        statusStyles[currentStatus] || statusStyles.applied
                      }`}
                    >
                      {statusOptions.find(
                        (option) => option.value === currentStatus
                      )?.label || currentStatus}
                    </span>

                    <label className="text-xs font-medium text-slate-400">
                      Update application
                    </label>

                    <select
                      value={currentStatus}
                      disabled={updatingId === applicant.id}
                      onChange={(event) =>
                        updateApplicationStatus(
                          applicant.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#10141E] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50 disabled:opacity-50"
                    >
                      {statusOptions
                        .filter((option) => option.value !== "applied")
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      {currentStatus === "applied" && (
                        <option value="applied">Applied</option>
                      )}
                    </select>

                    {updatingId === applicant.id && (
                      <p className="text-xs text-slate-400">
                        Saving status...
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EmployerApplicantsPage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <DashboardLayout role="employer">
        <EmployerApplicantsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}