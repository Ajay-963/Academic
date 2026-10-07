"use client";

import AcademicLogo from "@/app/components/AcademicLogo";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Profile = {
  full_name: string | null;
  program: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
};

type Semester = {
  id: string;
  name: string;
  is_active: boolean;
};

type Course = {
  id: string;
  name: string;
  code: string;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [activeSemester, setActiveSemester] =
    useState<Semester | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);

  const [fullName, setFullName] = useState("");
  const [program, setProgram] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Please log in to view your profile.");
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? "");
    setUserId(user.id);

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "full_name, program, department, created_at, updated_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setFullName(profileData?.full_name ?? "");
    setProgram(profileData?.program ?? "");
    setDepartment(profileData?.department ?? "");

    const {
      data: semesterData,
      error: semesterError,
    } = await supabase
      .from("semesters")
      .select("id, name, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (semesterError) {
      setError(semesterError.message);
      setLoading(false);
      return;
    }

    setActiveSemester(semesterData);

    if (semesterData) {
      const {
        data: courseData,
        error: courseError,
      } = await supabase
        .from("courses")
        .select("id, name, code")
        .eq("user_id", user.id)
        .eq("semester_id", semesterData.id)
        .order("name");

      if (courseError) {
        setError(courseError.message);
        setLoading(false);
        return;
      }

      setCourses(courseData ?? []);
    } else {
      setCourses([]);
    }

    setLoading(false);
  }

  async function handleSaveProfile() {
    const trimmedName = fullName.trim();
    const trimmedProgram = program.trim();
    const trimmedDepartment = department.trim();

    if (!trimmedName) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!trimmedProgram) {
      setError("Program cannot be empty.");
      return;
    }

    if (!trimmedDepartment) {
      setError("Department cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName,
        program: trimmedProgram,
        department: trimmedDepartment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select(
        "full_name, program, department, created_at, updated_at"
      )
      .single();

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setProfile(data);
    setFullName(data.full_name ?? "");
    setProgram(data.program ?? "");
    setDepartment(data.department ?? "");
    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  function getInitials(name: string) {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "A";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return `${parts[0].slice(0, 1)}${
      parts[parts.length - 1].slice(0, 1)
    }`.toUpperCase();
  }

  function formatDate(dateString: string | undefined) {
    if (!dateString) {
      return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="animate-pulse">
            <div className="h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />

                <div className="flex-1">
                  <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-3 h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.full_name?.trim() || "Academic Student";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* PAGE HEADER */}
        <div className="mb-6">
          <AcademicLogo showName={false} size="sm" />

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Account
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Your profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Manage your personal information and see a quick overview of
              your academic account.
            </p>
          </div>
        </div>

        {/* PROFILE HERO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white dark:bg-white dark:text-slate-900"
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-950 dark:text-white">
                  {displayName}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {userEmail || "No email available"}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Student account
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        {(message || error) && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
            }`}
            role="status"
          >
            {error || message}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* PERSONAL INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Personal information
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Profile details
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Update the information displayed throughout your Academic
                account.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Full name
                </label>

                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  autoComplete="name"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-700"
                  placeholder="Enter your full name"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Email changes will be handled through account settings.
                </p>
              </div>

              {/* PROGRAM */}
              <div>
                <label
                  htmlFor="program"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Program
                </label>

                <input
                  id="program"
                  type="text"
                  value={program}
                  onChange={(event) => {
                    setProgram(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  autoComplete="organization-title"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-700"
                  placeholder="e.g. B.Tech"
                />
              </div>

              {/* DEPARTMENT */}
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  autoComplete="organization"
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-700"
                  placeholder="e.g. Mathematics and Computing"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          {/* ACADEMIC OVERVIEW */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Academic information
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Current overview
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Your current academic information and active semester.
              </p>
            </div>

            <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-700">
              {/* PROGRAM */}
              <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Program
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Your academic program
                  </p>
                </div>

                <p className="max-w-[55%] text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {profile?.program?.trim() || "Not set"}
                </p>
              </div>

              {/* DEPARTMENT */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Department
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Your academic department
                  </p>
                </div>

                <p className="max-w-[55%] text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {profile?.department?.trim() || "Not set"}
                </p>
              </div>

              {/* ACTIVE SEMESTER */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Active semester
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Your currently active semester
                  </p>
                </div>

                <p className="max-w-[55%] text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {activeSemester?.name ?? "None"}
                </p>
              </div>

              {/* ACTIVE COURSES */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Active courses
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Courses in your active semester
                  </p>
                </div>

                <p className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {courses.length}
                </p>
              </div>

              {/* COURSE LIST */}
              <div className="py-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Course list
                </p>

                {courses.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    No courses have been added to your active semester yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {course.name}
                        </span>

                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {course.code || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ACCOUNT INFORMATION */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Account information
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Account details
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Member since
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {formatDate(profile?.created_at)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Account ID
              </p>

              <p
                className="mt-2 truncate font-mono text-xs text-slate-600 dark:text-slate-300"
                title={userId}
              >
                {userId || "—"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}