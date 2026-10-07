import AcademicLogo from "@/app/components/AcademicLogo";
import Link from "next/link";

const features = [
  {
    title: "Manage semesters",
    description:
      "Keep your current and previous semesters organized in one place.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M4 7.5 12 4l8 3.5L12 11 4 7.5Z"
          fill="currentColor"
        />
        <path
          d="M7 9.2V14c0 1.8 2.2 3.5 5 3.5s5-1.7 5-3.5V9.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 8v5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Track courses & absences",
    description:
      "Monitor your courses and keep track of your absence allowance.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M5 5.5h14v13H5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 9h7M8.5 12h7M8.5 15h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Plan your timetable",
    description:
      "Manage your weekly schedule and quickly see how your academic week looks.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8 3.5v3M16 3.5v3M4 9h16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M8 12h2M13 12h3M8 15h2M13 15h3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "See your academic overview",
    description:
      "Get a clear picture of your academic information without jumping between tools.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M5 19V9M12 19V5M19 19v-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3.5 19.5h17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <AcademicLogo href="/" size="md" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <span className="hidden sm:inline">Create Account</span>
              <span className="sm:hidden">Sign up</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-0 h-80 bg-gradient-to-b from-slate-100 to-transparent dark:from-slate-900/80 dark:to-transparent" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
          {/* HERO CONTENT */}
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Your academic life, organized
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              Stay on top of your{" "}
              <span className="text-slate-500 dark:text-slate-400">
                academic life.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
              Academic brings your semesters, courses, absences, and timetable
              together in one simple place — so you can spend less time
              organizing and more time studying.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Get started
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="ml-2 h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10h12M11 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span>✓ Semester management</span>
              <span>✓ Course tracking</span>
              <span>✓ Timetable</span>
            </div>
          </div>

          {/* PRODUCT PREVIEW */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-slate-200/60 blur-2xl dark:bg-slate-800/50" />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
              {/* PREVIEW HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>

                <span className="text-xs font-medium text-slate-400">
                  Academic
                </span>
              </div>

              {/* PREVIEW BODY */}
              <div className="p-4 sm:p-6">
                <div className="mb-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Dashboard preview
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                    Your academic life, at a glance
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current semester
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      Your semester
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full w-3/4 rounded-full bg-slate-900 dark:bg-white" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Courses
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      Your courses
                    </p>
                    <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                      Stay organized
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Weekly schedule
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        Keep your classes organized
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      View
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700/60">
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Computer Networks
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          10:00 AM
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Room 204
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700/60">
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Operating Systems
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          2:00 PM
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Lab 3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Everything in one place
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Built around your academic workflow.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Academic keeps the everyday parts of managing your semester
              together without adding unnecessary complexity.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center dark:bg-slate-800 sm:px-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to organize your semester?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Create your Academic account and bring your academic workflow
              together in one place.
            </p>

            <div className="mt-7">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Create your account
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="ml-2 h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10h12M11 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-center text-xs text-slate-500 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8 dark:text-slate-400">
          <AcademicLogo href="/" showName={false} size="sm" />

          <p>
            Academic — manage your academic life in one place.
          </p>
        </div>
      </footer>
    </main>
  );
}