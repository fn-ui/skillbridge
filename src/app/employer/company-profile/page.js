
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  ImagePlus,
  Save,
  ArrowLeft,
  Trash2,
  ExternalLink,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1019] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]";

function CompanyProfileContent() {
  const { user } = useAuth();

  const [company, setCompany] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
  });

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function loadCompany() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("id, employer_id, name, description, website, logo_url")
        .eq("employer_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setCompany(data);

        setForm({
          name: data.name || "",
          description: data.description || "",
          website: data.website || "",
        });
      }

      setLoading(false);
    }

    loadCompany();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedLogo) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedLogo);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedLogo]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a PNG, JPG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Your logo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setSelectedLogo(file);
    setRemoveLogo(false);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!user?.id) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const website = form.website.trim();

    if (!name) {
      setError("Company name is required.");
      return;
    }

    if (website) {
      try {
        const parsed = new URL(website);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        setError("Enter a valid company website URL.");
        return;
      }
    }

    setSaving(true);

    try {
      let logoUrl = removeLogo ? null : company?.logo_url || null;

      // Upload a newly selected company logo.
      if (selectedLogo) {
        const extension = selectedLogo.name.split(".").pop().toLowerCase();

        const filePath = `${user.id}/company-logo-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, selectedLogo, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedLogo.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(filePath);

        logoUrl = publicUrlData.publicUrl;
      }

      const payload = {
        employer_id: user.id,
        name,
        description: form.description.trim() || null,
        website: website || null,
        logo_url: logoUrl,
      };

      let result;

      if (company) {
        result = await supabase
          .from("companies")
          .update({
            name: payload.name,
            description: payload.description,
            website: payload.website,
            logo_url: payload.logo_url,
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

      if (result.error) throw result.error;

      setCompany(result.data);
      setSelectedLogo(null);
      setRemoveLogo(false);
      setSuccess("Company profile saved successfully.");
    } catch (err) {
      console.error("Company profile save error:", err);
      setError(err.message || "Unable to save your company profile.");
    } finally {
      setSaving(false);
    }
  }

  function clearLogo() {
    setSelectedLogo(null);
    setRemoveLogo(true);
    setError("");
    setSuccess("");
  }

  const displayedLogo = preview || (removeLogo ? "" : company?.logo_url);

  return (
    <DashboardLayout role="employer">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link
            href="/employer/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#f5c451]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <p className="text-sm uppercase tracking-[0.2em] text-[#f5c451]">
            Employer Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Company Profile
          </h1>

          <p className="mt-3 max-w-2xl text-gray-400">
            Manage your organisation's information and branding. Students
            can use these details to learn more about your company.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#111722] p-8 text-center text-gray-400">
            Loading company profile...
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-7">
            {/* Company logo */}
            <section className="rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <ImagePlus className="text-[#f5c451]" size={22} />
                <div>
                  <h2 className="font-semibold">Company logo</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a professional logo for your organisation.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0b1019]">
                  {displayedLogo ? (
                    <img
                      src={displayedLogo}
                      alt="Company logo preview"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Building2 size={42} className="text-gray-600" />
                  )}
                </div>

                <div className="space-y-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#f5c451] px-4 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78]">
                    <ImagePlus size={17} />
                    Choose logo

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>

                  {(displayedLogo || selectedLogo) && (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="flex items-center gap-2 text-sm text-red-300 transition hover:text-red-200"
                    >
                      <Trash2 size={15} />
                      Remove logo
                    </button>
                  )}

                  <p className="text-xs text-gray-500">
                    PNG, JPG or WEBP. Maximum size: 2 MB.
                  </p>
                </div>
              </div>
            </section>

            {/* Company details */}
            <section className="space-y-6 rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <Building2 className="text-[#f5c451]" size={22} />
                <div>
                  <h2 className="font-semibold">Company information</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Keep your organisation's information accurate and up to date.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="company-name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Company name *
                </label>

                <input
                  id="company-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
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
                  value={form.description}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Tell students about your organisation, what it does, and the opportunities it offers..."
                  rows={6}
                  maxLength={2000}
                />

                <p className="mt-2 text-right text-xs text-gray-500">
                  {form.description.length}/2000 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="company-website"
                  className="mb-2 flex items-center gap-2 text-sm text-gray-300"
                >
                  <Globe size={15} />
                  Company website
                </label>

                <input
                  id="company-website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="https://example.com"
                />

                {company?.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-[#f5c451] hover:text-[#ffda78]"
                  >
                    Visit current website
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-6 py-3.5 text-sm font-bold text-[#080b12] transition hover:bg-[#ffda78] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving profile..." : "Save company profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EmployerCompanyProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <CompanyProfileContent />
    </ProtectedRoute>
  );
}
