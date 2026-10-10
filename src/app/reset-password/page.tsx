
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    
async function verifyRecoveryLink() {
  const supabase = createClient();

  try {
    const url = new URL(window.location.href);

    const urlError =
      url.searchParams.get("error_description") ||
      new URLSearchParams(url.hash.slice(1)).get(
        "error_description"
      );

    if (urlError) {
      if (!cancelled) {
        setError(
          "The recovery link could not be verified. Please request a new password reset link."
        );
        setCheckingRecovery(false);
      }
      return;
    }

    // Let the Supabase browser client process the recovery URL.
    // Do not exchange the same code a second time.
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      if (!cancelled) {
        setError(
          "This recovery link is invalid, expired, or could not be verified. Please request a new one."
        );
        setCheckingRecovery(false);
      }
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (!cancelled) {
        setError(
          "Unable to verify your recovery session. Please request a new reset link."
        );
        setCheckingRecovery(false);
      }
      return;
    }

    if (!cancelled) {
      window.history.replaceState(
        window.history.state,
        "",
        "/reset-password"
      );

      setRecoveryReady(true);
      setCheckingRecovery(false);
    }
  } catch {
    if (!cancelled) {
      setError(
        "Unable to verify the recovery link. Please request a new one."
      );
      setCheckingRecovery(false);
    }
  }
}

    void verifyRecoveryLink();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Recheck the authenticated user before changing credentials.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !recoveryReady) {
        setError(
          "Your recovery session is no longer valid. Please request a new reset link."
        );
        setRecoveryReady(false);
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setCompleted(true);
      setMessage("Your password has been reset successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Reset Password
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {checkingRecovery
              ? "Verifying your recovery link..."
              : completed
                ? "Your account password has been updated."
                : recoveryReady
                  ? "Choose a new password for your Academic account."
                  : "Password recovery requires a valid email link."}
          </p>
        </div>

        {checkingRecovery ? (
          <div
            role="status"
            className="py-6 text-center text-sm text-slate-600 dark:text-slate-300"
          >
            Please wait while we verify your link...
          </div>
        ) : completed ? (
          <div className="space-y-5">
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Back to Login
            </button>
          </div>
        ) : recoveryReady ? (
          <form
            onSubmit={handleResetPassword}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                New Password
              </label>

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Enter the password again"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) =>
                  setShowPassword(event.target.checked)
                }
                className="size-4 rounded"
              />
              Show passwords
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {loading ? "Updating password..." : "Reset Password"}
            </button>
          </form>
        ) : null}

        {error && (
          <div className="mt-5 space-y-3">
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
            >
              {error}
            </p>

            {!checkingRecovery && !recoveryReady && (
              <button
                type="button"
                onClick={() => router.replace("/login")}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Return to Login
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
