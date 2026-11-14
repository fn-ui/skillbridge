
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FolderKanban, FileText, Sparkles } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

function calculateSkillMatch(requiredSkills, studentSkillIds) {
  if (!requiredSkills.length) {
    return {
      percentage: null,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = requiredSkills.filter((skill) =>
    studentSkillIds.has(skill.id)
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !studentSkillIds.has(skill.id)
  );

  return {
    percentage: Math.round(
      (matchedSkills.length / requiredSkills.length) * 100
    ),
    matchedSkills,
    missingSkills,
  };
}

function StudentDashboardContent() {
  const { user, profile } = useAuth();

  const [stats, setStats] = useState({
    matchedOpportunities: 0,
    projects: 0,
    applications: 0,
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [
          opportunitiesResult,
          studentSkillsResult,
          skillsResult,
          projectsResult,
          applicationsResult,
          companiesResult,
        ] = await Promise.all([
          supabase
            .from("opportunities")
            .select("id, title, description, location, opportunity_type, deadline, company_id, created_at")
            .eq("status", "published")
            .order("created_at", { ascending: false }),

          supabase
            .from("user_skills")
            .select("skill_id")
            .eq("user_id", user.id),

          supabase
            .from("skills")
            .select("id, name"),

          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("student_id", user.id),

          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("student_id", user.id),

          supabase
            .from("companies")
            .select("id, name"),
        ]);

        if (opportunitiesResult.error) throw opportunitiesResult.error;
        if (studentSkillsResult.error) throw studentSkillsResult.error;
        if (skillsResult.error) throw skillsResult.error;
        if (projectsResult.error) throw projectsResult.error;
        if (applicationsResult.error) throw applicationsResult.error;
        if (companiesResult.error) throw companiesResult.error;

        const opportunities = opportunitiesResult.data || [];
        const studentSkillIds = new Set(
          (studentSkillsResult.data || []).map((item) => item.skill_id)
        );

        const skillsById = new Map(
          (skillsResult.data || []).map((skill) => [skill.id, skill])
        );

        const companiesById = new Map(
          (companiesResult.data || []).map((company) => [
            company.id,
            company.name,
          ])
        );

        let requiredSkillsByOpportunity = new Map();

        if (opportunities.length > 0) {
          const opportunityIds = opportunities.map((item) => item.id);

          const { data: requirementRows, error: requirementsError } =
            await supabase
              .from("opportunity_skills")
              .select("opportunity_id, skill_id")
              .in("opportunity_id", opportunityIds);

          if (requirementsError) throw requirementsError;

          (requirementRows || []).forEach((row) => {
            const skill = skillsById.get(row.skill_id);
            if (!skill) return;

            const existing =
              requiredSkillsByOpportunity.get(row.opportunity_id) || [];

            existing.push(skill);
            requiredSkillsByOpportunity.set(row.opportunity_id, existing);
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mappedOpportunities = opportunities
          .filter((opportunity) => {
            if (!opportunity.deadline) return true;

            const deadline = new Date(`${opportunity.deadline}T00:00:00`);
            return deadline >= today;
          })
          .map((opportunity) => {
            const requiredSkills =
              requiredSkillsByOpportunity.get(opportunity.id) || [];

            const skillMatch = calculateSkillMatch(
              requiredSkills,
              studentSkillIds
            );

            return {
              ...opportunity,
              companyName:
                companiesById.get(opportunity.company_id) || "Company",
              requiredSkills,
              ...skillMatch,
            };
          });

        const rankedRecommendations = mappedOpportunities
          .filter((item) => item.percentage !== null)
          .sort((a, b) => {
            return (
              b.percentage - a.percentage ||
              new Date(b.created_at) - new Date(a.created_at)
            );
          })
          .slice(0, 3);

        const matchedCount = mappedOpportunities.filter(
          (item) => item.percentage > 0
        ).length;

        if (!isMounted) return;

        setStats({
          matchedOpportunities: matchedCount,
          projects: projectsResult.count || 0,
          applications: applicationsResult.count || 0,
        });

        setRecommendations(rankedRecommendations);
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (isMounted) {
          setError("We couldn't load your dashboard information. Please refresh and try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const hasRecommendations = recommendations.length > 0;

  return (
    <DashboardLayout role="student">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Student Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Welcome, {profile?.full_name || "Student"}
        </h1>

        <p className="mt-3 max-w-2xl text-gray-400">
          Discover opportunities, showcase your projects, and grow your
          professional skills.
        </p>

        {/* Dashboard statistics */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Matched Opportunities
              </p>
              <BriefcaseBusiness className="text-[#f5c451]" size={21} />
            </div>

            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.matchedOpportunities}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Opportunities matching your skills
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Projects</p>
              <FolderKanban className="text-[#f5c451]" size={21} />
            </div>

            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.projects}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Projects in your portfolio
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Applications</p>
              <FileText className="text-[#f5c451]" size={21} />
            </div>

            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.applications}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Opportunities you have applied for
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#f5c451]" size={20} />

                <p className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">
                  Personalized for you
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-bold">
                Recommended Opportunities
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Opportunities ranked according to how well your skills match.
              </p>
            </div>

            <Link
              href="/student/opportunities"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5c451] transition hover:text-white"
            >
              Explore all opportunities
              <ArrowRight size={17} />
            </Link>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center text-gray-400">
              Loading your recommendations...
            </div>
          ) : !hasRecommendations ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center">
              <Sparkles className="mx-auto text-[#f5c451]" size={30} />

              <h3 className="mt-4 text-lg font-semibold">
                Build your skill profile
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">
                Add skills to your profile and make sure opportunities have
                required skills listed. SkillBridge will then recommend
                opportunities that match your abilities.
              </p>

              <Link
                href="/student/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-bold text-[#111722] transition hover:bg-[#ffda78]"
              >
                Update my skills
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {recommendations.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="rounded-2xl border border-white/10 bg-[#111722] p-6 transition hover:border-[#f5c451]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {opportunity.companyName}
                      </p>

                      <h3 className="mt-2 text-lg font-bold">
                        {opportunity.title}
                      </h3>
                    </div>

                    <div className="shrink-0 rounded-xl border border-[#f5c451]/20 bg-[#f5c451]/10 px-3 py-2 text-center">
                      <p className="text-xl font-bold text-[#f5c451]">
                        {opportunity.percentage}%
                      </p>
                      <p className="text-[10px] text-gray-400">Match</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-400">
                    {opportunity.location || "Location not specified"}
                  </p>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-400">Skill compatibility</span>
                      <span className="text-[#f5c451]">
                        {opportunity.percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#f5c451]"
                        style={{
                          width: `${opportunity.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold text-green-400">
                      Matched skills
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {opportunity.matchedSkills.length > 0 ? (
                        opportunity.matchedSkills.map((skill) => (
                          <span
                            key={skill.id}
                            className="rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs text-green-300"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No matching skills yet
                        </span>
                      )}
                    </div>
                  </div>

                  {opportunity.missingSkills.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-orange-300">
                        Skills to develop
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {opportunity.missingSkills.map((skill) => (
                          <span
                            key={skill.id}
                            className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-200"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/student/opportunities"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5c451]/30 px-4 py-3 text-sm font-semibold text-[#f5c451] transition hover:bg-[#f5c451] hover:text-[#111722]"
                  >
                    View opportunity
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
