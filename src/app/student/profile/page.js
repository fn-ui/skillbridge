
"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  UserRound,
  MapPin,
  Code2,
  Camera,
  CheckCircle2,
  Circle,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c451]";

const proficiencyLevels = ["Beginner", "Intermediate", "Advanced"];

export default function StudentProfilePage() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [proficiency, setProficiency] = useState("Beginner");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      const [
        profileResult, 
        skillsResult, 
        userSkillsResult,
        projectsResult,
        ] =await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, bio, location, profile_image")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("skills")
            .select("id, name, category")
            .order("name"),

          supabase
            .from("user_skills")
            .select("id, skill_id, proficiency")
            .eq("user_id", user.id),

            supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("student_id", user.id),
        ]);

      if (!active) return;

      const loadError =
        profileResult.error ||
        skillsResult.error ||
        userSkillsResult.error||
        projectsResult.error;

      if (loadError) {
        setErrorMessage(loadError.message);
      } else {
        const profile = profileResult.data;

        setFullName(profile?.full_name || "");
        setBio(profile?.bio || "");
        setLocation(profile?.location || "");
        setProfileImage(profile?.profile_image || "");
        setProjectCount(projectsResult.count || 0);

        const skills = skillsResult.data || [];
        const assignedSkills = userSkillsResult.data || [];

        setAllSkills(skills);

        setMySkills(
          assignedSkills.map((entry) => ({
            ...entry,
            skill: skills.find(
              (skill) => skill.id === entry.skill_id
            ),
          }))
        );
      }

      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function saveProfile(event) {
    event.preventDefault();

    if (!user?.id) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      })
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage("Your profile has been saved.");
    }

    setSaving(false);
  }

  async function uploadProfileImage(event) {
  const file = event.target.files?.[0];

  if (!file || !user?.id) return;

  setMessage("");
  setErrorMessage("");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    setErrorMessage("Please select a JPG, PNG, or WEBP image.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setErrorMessage("Your profile image must be smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  setUploadingImage(true);

  const extension = file.name.split(".").pop().toLowerCase();
  const filePath = `${user.id}/profile-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("student-profile-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    setErrorMessage(uploadError.message);
    setUploadingImage(false);
    event.target.value = "";
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("student-profile-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ profile_image: imageUrl })
    .eq("user_id", user.id);

  if (updateError) {
    // Remove the newly uploaded file if saving its URL fails.
    await supabase.storage
      .from("student-profile-images")
      .remove([filePath]);

    setErrorMessage(updateError.message);
  } else {
    setProfileImage(imageUrl);
    setMessage("Your profile photo has been updated.");
  }

  setUploadingImage(false);
  event.target.value = "";
}

  async function addSkill(event) {
    event.preventDefault();

    if (!user?.id || !selectedSkill) return;

    const skillId = Number(selectedSkill);

    setAddingSkill(true);
    setMessage("");
    setErrorMessage("");

    const existing = mySkills.find(
      (entry) => entry.skill_id === skillId
    );

    let result;

    if (existing) {
      result = await supabase
        .from("user_skills")
        .update({ proficiency })
        .eq("id", existing.id)
        .eq("user_id", user.id);
    } else {
      result = await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
        proficiency,
      });
    }

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      const { data, error } = await supabase
        .from("user_skills")
        .select("id, skill_id, proficiency")
        .eq("user_id", user.id);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setMySkills(
          (data || []).map((entry) => ({
            ...entry,
            skill: allSkills.find(
              (skill) => skill.id === entry.skill_id
            ),
          }))
        );

        setSelectedSkill("");
        setMessage(
          existing
            ? "Skill proficiency updated."
            : "Skill added to your profile."
        );
      }
    }

    setAddingSkill(false);
  }

  async function removeSkill(entryId) {
    if (!user?.id) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("user_skills")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMySkills((current) =>
      current.filter((entry) => entry.id !== entryId)
    );

    setMessage("Skill removed from your profile.");
  }

  const availableSkills = allSkills.filter(
    (skill) =>
      !mySkills.some((entry) => entry.skill_id === skill.id)
  );

  const completionItems = [
  {
    label: "Add your full name",
    completed: fullName.trim().length > 0,
  },
  {
    label: "Upload a profile photo",
    completed: Boolean(profileImage),
  },
  {
    label: "Write your professional bio",
    completed: bio.trim().length >= 30,
  },
  {
    label: "Add your location",
    completed: location.trim().length > 0,
  },
  {
    label: "Add at least one skill",
    completed: mySkills.length > 0,
  },
  {
    label: "Add at least one project",
    completed: projectCount > 0,
  },
];

const completedItems = completionItems.filter(
  (item) => item.completed
).length;

const completionPercentage = Math.round(
  (completedItems / completionItems.length) * 100
);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout role="student">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <p className="mb-2 text-sm font-medium text-[#f5c451]">
              YOUR PROFESSIONAL IDENTITY
            </p>

            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Tell employers who you are, what you do, and which
              skills you bring. Your profile will help SkillBridge
              find opportunities that fit you.
            </p>
          </div>
          {/* Profile completion */}
          <section className="rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#f5c451]">
                  PROFILE COMPLETION
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {completionPercentage}% complete
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Complete your profile to help employers understand your experience.
                </p>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#f5c451]/30">
                <span className="text-xl font-bold text-[#f5c451]">
                  {completionPercentage}%
                </span>
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#f5c451] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {completionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 text-sm"
                >
                  {item.completed ? (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-400"
                    />
                  ) : (
                    <Circle
                      size={18}
                      className="shrink-0 text-gray-500"
                    />
                  )}

                  <span
                    className={
                      item.completed
                        ? "text-gray-300"
                        : "text-gray-500"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {message}
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

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#111722] p-8 text-gray-400">
              Loading your profile...
            </div>
          ) : (
            <>
              <form
                onSubmit={saveProfile}
                className="rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8"
              >
                {/* Profile photo */}
            <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#f5c451]/40 bg-[#0b1019]">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Your profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={38} className="text-gray-500" />
                )}

                <div className="absolute bottom-0 right-0 rounded-full bg-[#f5c451] p-1.5 text-[#080b12]">
                  <Camera size={14} />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  Profile photo
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Upload a professional photo so employers can recognize you.
                </p>

                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#f5c451]/40 px-4 py-2.5 text-sm font-semibold text-[#f5c451] transition hover:bg-[#f5c451]/10">
                  <ImagePlus size={16} />
                  {uploadingImage ? "Uploading..." : "Choose photo"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadProfileImage}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WEBP. Maximum size: 2 MB.
                </p>
              </div>
            </div>
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-xl bg-[#f5c451]/10 p-3 text-[#f5c451]">
                    <UserRound size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Personal information
                    </h2>
                    <p className="text-sm text-gray-400">
                      Keep your details accurate and up to date.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm text-gray-300">
                      Full name
                    </label>

                    <input
                      className={inputClass}
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm text-gray-300">
                      About me
                    </label>

                    <textarea
                      className={inputClass}
                      value={bio}
                      onChange={(event) =>
                        setBio(event.target.value)
                      }
                      placeholder="Describe your interests, experience, and career goals..."
                      rows={4}
                      maxLength={1000}
                    />

                    <p className="mt-2 text-right text-xs text-gray-500">
                      {bio.length}/1000 characters
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-300">
                      <MapPin size={15} />
                      Location
                    </label>

                    <input
                      className={inputClass}
                      value={location}
                      onChange={(event) =>
                        setLocation(event.target.value)
                      }
                      placeholder="e.g. Nairobi, Kenya"
                      maxLength={150}
                    />
                  </div>
                </div>

                <div className="mt-7 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] transition hover:bg-[#ffda78] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>

              <section className="rounded-2xl border border-white/10 bg-[#111722] p-6 sm:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-xl bg-[#f5c451]/10 p-3 text-[#f5c451]">
                    <Code2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      My skills
                    </h2>
                    <p className="text-sm text-gray-400">
                      Add skills and indicate your current proficiency.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={addSkill}
                  className="grid gap-4 sm:grid-cols-[1fr_180px_auto]"
                >
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Select a skill
                    </label>

                    <select
                      className={inputClass}
                      value={selectedSkill}
                      onChange={(event) =>
                        setSelectedSkill(event.target.value)
                      }
                      required
                    >
                      <option value="">Choose a skill</option>

                      {availableSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Proficiency
                    </label>

                    <select
                      className={inputClass}
                      value={proficiency}
                      onChange={(event) =>
                        setProficiency(event.target.value)
                      }
                    >
                      {proficiencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!selectedSkill || addingSkill}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5c451]/40 px-4 py-3 text-sm font-semibold text-[#f5c451] transition hover:bg-[#f5c451]/10 disabled:opacity-50 sm:w-auto"
                    >
                      <Plus size={17} />
                      {addingSkill ? "Adding..." : "Add skill"}
                    </button>
                  </div>
                </form>

                <div className="mt-8">
                  <h3 className="mb-4 text-sm font-semibold text-gray-300">
                    Skills on your profile ({mySkills.length})
                  </h3>

                  {mySkills.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-7 text-center">
                      <Code2
                        size={28}
                        className="mx-auto mb-3 text-gray-500"
                      />

                      <p className="text-sm text-gray-300">
                        You haven't added any skills yet.
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Add your first skill using the form above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {mySkills.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1019] p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {entry.skill?.name || "Unknown skill"}
                            </p>

                            <span className="mt-2 inline-block rounded-full bg-[#f5c451]/10 px-3 py-1 text-xs text-[#f5c451]">
                              {entry.proficiency}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSkill(entry.id)}
                            aria-label={`Remove ${entry.skill?.name || "skill"}`}
                            title="Remove skill"
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
