"use client";

import AcademicLogo from "@/app/components/AcademicLogo";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Semester",
    href: "/semester",
  },
  {
    label: "Courses",
    href: "/courses",
  },
  {
    label: "Absences",
    href: "/absences",
  },
];

type ProfileData = {
  full_name: string | null;
};

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [accountLoading, setAccountLoading] = useState(true);

  /*
   * The application navigation should not appear on
   * public/authentication pages.
   */
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup";

  /*
   * Load the saved theme and authenticated account information.
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }

    async function loadAccount() {
      setAccountLoading(true);

      try {
        /*
         * First get the authenticated user.
         * This is the authoritative source for the account email.
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          /*
           * If getUser does not immediately return the user,
           * try the existing local session as a safe fallback.
           */
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            setUserName("");
            setUserEmail("");
            setAccountLoading(false);
            return;
          }

          const sessionUser = session.user;

          setUserEmail(sessionUser.email ?? "");

          const metadataName =
            typeof sessionUser.user_metadata?.full_name === "string"
              ? sessionUser.user_metadata.full_name.trim()
              : "";

          if (metadataName) {
            setUserName(metadataName);
          } else {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", sessionUser.id)
              .maybeSingle<ProfileData>();

            setUserName(profileData?.full_name?.trim() ?? "");
          }

          setAccountLoading(false);
          return;
        }

        /*
         * Email comes directly from Supabase Auth.
         */
        setUserEmail(user.email ?? "");

        /*
         * Prefer the profile table because Profile page also
         * uses it as the source of the student's full name.
         */
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle<ProfileData>();

        const profileName = profileData?.full_name?.trim() ?? "";

        /*
         * If the profile has no name, use Supabase metadata.
         */
        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "";

        setUserName(profileName || metadataName);
      } catch {
        /*
         * Do not break the entire Navbar if account loading fails.
         */
        setUserName("");
        setUserEmail("");
      } finally {
        setAccountLoading(false);
      }
    }

    loadAccount();
  }, [supabase]);

  /*
   * Prevent the page behind the mobile drawer from scrolling.
   */
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /*
   * Close the mobile menu or account dropdown with Escape.
   */
  useEffect(() => {
    if (!menuOpen && !accountMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setMenuOpen(false);
      setAccountMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, accountMenuOpen]);

  /*
   * Close the desktop account dropdown when clicking outside it.
   */
  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [accountMenuOpen]);

  function toggleDarkMode() {
    const nextDarkMode = !darkMode;

    setDarkMode(nextDarkMode);

    if (nextDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function closeAccountMenu() {
    setAccountMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    closeAccountMenu();

    await supabase.auth.signOut();

    router.push("/login");
  }

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function getDisplayName() {
    if (userName.trim()) {
      return userName.trim();
    }

    if (userEmail.trim()) {
      const emailName = userEmail.split("@")[0]?.trim();

      if (emailName) {
        return emailName;
      }
    }

    return "Academic Student";
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
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0].slice(0, 1)}${
      parts[parts.length - 1].slice(0, 1)
    }`.toUpperCase();
  }

  if (isPublicPage) {
    return null;
  }

  const displayName = getDisplayName();
  const initials = getInitials(displayName);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* DESKTOP / MOBILE HEADER */}
        <div className="flex min-h-16 items-center justify-between gap-4">
          {/* LOGO */}
          <AcademicLogo href="/dashboard" size="md" />

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* THEME TOGGLE */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-base transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* ACCOUNT */}
            <div
              ref={accountMenuRef}
              className="relative ml-2"
            >
              <button
                type="button"
                onClick={() =>
                  setAccountMenuOpen((current) => !current)
                }
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900"
              >
                {accountLoading ? (
                  <span
                    className="h-4 w-4 animate-pulse rounded-full bg-white/30 dark:bg-slate-900/20"
                    aria-hidden="true"
                  />
                ) : (
                  initials
                )}
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
                >
                  {/* ACCOUNT HEADER */}
                  <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white dark:bg-white dark:text-slate-900"
                        aria-hidden="true"
                      >
                        {accountLoading ? "…" : initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                          {accountLoading
                            ? "Loading account..."
                            : displayName}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {accountLoading
                            ? "Please wait..."
                            : userEmail || "Email unavailable"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT LINKS */}
                  <div className="p-2">
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={closeAccountMenu}
                      className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={closeAccountMenu}
                      className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.24v2.4h-.24A1.7 1.7 0 0 0 19.4 15Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* SIGN OUT */}
                  <div className="border-t border-slate-200 p-2 dark:border-slate-700">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex min-h-12 w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M10 17l5-5-5-5M15 12H3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>

                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE CONTROLS */}
          <div className="flex items-center gap-2 md:hidden">
            {/* THEME TOGGLE */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-base transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* MENU TOGGLE */}
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={
                menuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {menuOpen && (
          <>
            {/* BACKDROP */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="fixed inset-0 top-16 z-40 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
            />

            {/* DRAWER */}
            <div
              id="mobile-navigation"
              className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 md:hidden"
            >
              <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
                {/* MOBILE ACCOUNT HEADER */}
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                    aria-hidden="true"
                  >
                    {accountLoading ? "…" : initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {accountLoading
                        ? "Loading account..."
                        : displayName}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {accountLoading
                        ? "Please wait..."
                        : userEmail || "Email unavailable"}
                    </p>
                  </div>
                </div>

                {/* NAVIGATION LINKS */}
                <div className="flex flex-col gap-1">
                  {navigationItems.map((item) => {
                    const active = isActiveRoute(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* MOBILE ACCOUNT ACTIONS */}
                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Settings
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}