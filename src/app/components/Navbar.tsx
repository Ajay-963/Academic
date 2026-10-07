"use client";

import AcademicLogo from "@/app/components/AcademicLogo";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * The application navigation should not appear on
   * public/authentication pages.
   */
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

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
   * Close the mobile menu when the user presses Escape.
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

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

  async function handleLogout() {
    closeMenu();

    await supabase.auth.signOut();

    router.push("/login");
  }

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (isPublicPage) {
    return null;
  }

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

            {/* LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Logout
            </button>
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
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
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
                    className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Logout
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