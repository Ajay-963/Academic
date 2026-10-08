"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AcademicLogo from "@/app/components/AcademicLogo";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [signingOut, setSigningOut] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Password state
  const [changingPassword, setChangingPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    attendance: true,
    classes: true,
    academic: true,
  });

  useEffect(() => {
    const savedNotifications = localStorage.getItem(
      "academic-notification-preferences",
    );

    if (!savedNotifications) {
      return;
    }

    try {
      const parsed = JSON.parse(savedNotifications);

      setNotifications({
        attendance:
          typeof parsed.attendance === "boolean"
            ? parsed.attendance
            : true,
        classes:
          typeof parsed.classes === "boolean" ? parsed.classes : true,
        academic:
          typeof parsed.academic === "boolean"
            ? parsed.academic
            : true,
      });
    } catch {
      // Ignore invalid local notification preferences.
    }
  }, []);

  function toggleNotification(
    key: "attendance" | "classes" | "academic",
  ) {
    setNotifications((current) => {
      const updated = {
        ...current,
        [key]: !current[key],
      };

      localStorage.setItem(
        "academic-notification-preferences",
        JSON.stringify(updated),
      );

      return updated;
    });

    setMessage("Notification preferences saved.");
    setError("");
  }

  async function handleSignOut() {
    setSigningOut(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
      return;
    }

    window.location.href = "/login";
  }

  function openPasswordForm() {
    setMessage("");
    setError("");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setChangingPassword(true);
  }

  function closePasswordForm() {
    if (updatingPassword) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setChangingPassword(false);
    setMessage("");
    setError("");
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Your new password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    setUpdatingPassword(true);

    const supabase = createClient();

    /*
     * Get the currently authenticated user first.
     * We need the user's email to verify the current password.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setError("Unable to verify your account. Please sign in again.");
      setUpdatingPassword(false);
      return;
    }

    /*
     * Verify the current password before allowing the password change.
     *
     * This also gives Supabase a recent authenticated login before
     * updateUser() is called.
     */
    const { error: verificationError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (verificationError) {
      setError("Your current password is incorrect.");
      setUpdatingPassword(false);
      return;
    }

    /*
     * Update the password through Supabase Auth.
     * No database table is modified here.
     */
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setUpdatingPassword(false);
      return;
    }

    /*
     * Clear the password form after a successful update.
     */
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setChangingPassword(false);
    setUpdatingPassword(false);

    setMessage("Your password has been changed successfully.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <AcademicLogo size="sm" href="/dashboard" />

            <Link
              href="/dashboard"
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Account
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Manage your account, security, notifications, and academic
              preferences.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Feedback */}
          {(message || error) && (
            <div
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              }`}
            >
              {error || message}
            </div>
          )}

          {/* Account */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Account
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Account settings
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Manage your personal information and account details.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Profile */}
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                    👤
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Profile
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Update your name, program, department, and academic
                      information.
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open profile
                </Link>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                  ✉️
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Email address
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Your account email is managed through your authentication
                    provider.
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Email management will be added with account security
                    features.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Security
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Account security
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Manage how your Academic account is protected.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Change password */}
              <div className="px-5 py-5 sm:px-6">
                {!changingPassword ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                        🔐
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Password
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          Change your password or recover access to your
                          account.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openPasswordForm}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Change password
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                        🔐
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Change password
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          Enter your current password and choose a new
                          password for your Academic account.
                        </p>
                      </div>
                    </div>

                    {/* Current password */}
                    <div>
                      <label
                        htmlFor="current-password"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Current password
                      </label>

                      <div className="relative">
                        <input
                          id="current-password"
                          type={
                            showCurrentPassword ? "text" : "password"
                          }
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          disabled={updatingPassword}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          placeholder="Enter current password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(
                              (current) => !current,
                            )
                          }
                          disabled={updatingPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        New password
                      </label>

                      <div className="relative">
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          disabled={updatingPassword}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          placeholder="Enter new password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              (current) => !current,
                            )
                          }
                          disabled={updatingPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {showNewPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Your new password must be at least 6 characters
                        long.
                      </p>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Confirm new password
                      </label>

                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={
                            showConfirmPassword ? "text" : "password"
                          }
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          disabled={updatingPassword}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          placeholder="Confirm new password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (current) => !current,
                            )
                          }
                          disabled={updatingPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closePasswordForm}
                        disabled={updatingPassword}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        {updatingPassword
                          ? "Updating password..."
                          : "Update password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sessions */}
              <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                  🛡️
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Active session
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    You are currently signed in to Academic on this device.
                    Session management will be expanded later.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Notifications
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Notification preferences
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Choose which academic events you want Academic to prepare
                notifications for.
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              {/* Attendance alerts */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-slate-900">
                    📊
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Attendance alerts
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Get notified when attendance needs attention.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.attendance}
                  aria-label="Toggle attendance alerts"
                  onClick={() => toggleNotification("attendance")}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    notifications.attendance
                      ? "bg-slate-900 dark:bg-white"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-900 ${
                      notifications.attendance
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Class reminders */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-slate-900">
                    📅
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Class reminders
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Receive reminders about upcoming classes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.classes}
                  aria-label="Toggle class reminders"
                  onClick={() => toggleNotification("classes")}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    notifications.classes
                      ? "bg-slate-900 dark:bg-white"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-900 ${
                      notifications.classes
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Academic updates */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-slate-900">
                    🎓
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Academic updates
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Receive important updates related to your academic
                      workspace.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.academic}
                  aria-label="Toggle academic updates"
                  onClick={() => toggleNotification("academic")}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    notifications.academic
                      ? "bg-slate-900 dark:bg-white"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-900 ${
                      notifications.academic
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <p className="pt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                Notification delivery will be connected in a future version.
                Your preferences are currently saved on this device.
              </p>
            </div>
          </section>

          {/* Academic preferences */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Academic
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Academic preferences
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Preferences for how your academic workspace behaves.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Active semester */}
              <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Active semester
                </h3>

                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Your active semester is currently managed from the Semester
                  section.
                </p>

                <div>
                  <Link
                    href="/semester"
                    className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Manage semesters
                  </Link>
                </div>
              </div>

              {/* Courses */}
              <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Courses
                </h3>

                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Manage your courses and course-related academic data from
                  the Courses section.
                </p>

                <div>
                  <Link
                    href="/courses"
                    className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Manage courses
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <section className="rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900/60 dark:bg-slate-900">
            <div className="border-b border-red-100 px-5 py-5 dark:border-red-900/40 sm:px-6">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Account access
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Sign out
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Sign out of your Academic account on this device.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You can sign in again at any time using your existing account.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>

          {/* Footer note */}
          <div className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Academic settings
          </div>
        </div>
      </div>
    </main>
  );
}