"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type {
  TimetableCourse,
  TimetableEntry,
} from "../semester/timetable-types";

type TodaysClassesProps = {
  entries: TimetableEntry[];
  courses: TimetableCourse[];
};

type ClassStatus =
  | "completed"
  | "ongoing"
  | "upcoming";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(
  startTime: string,
  endTime: string
) {
  return `${formatTime(startTime)} – ${formatTime(
    endTime
  )}`;
}

function getStatus(
  entry: TimetableEntry,
  currentMinutes: number
): ClassStatus {
  const start = timeToMinutes(
    entry.start_time
  );

  const end = timeToMinutes(
    entry.end_time
  );

  if (currentMinutes >= end) {
    return "completed";
  }

  if (
    currentMinutes >= start &&
    currentMinutes < end
  ) {
    return "ongoing";
  }

  return "upcoming";
}

function getStatusLabel(
  status: ClassStatus
) {
  if (status === "ongoing") {
    return "Ongoing";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Upcoming";
}

export default function TodaysClasses({
  entries,
  courses,
}: TodaysClassesProps) {
  const [currentTime, setCurrentTime] =
    useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const today = currentTime.getDay();

  const currentMinutes =
    currentTime.getHours() * 60 +
    currentTime.getMinutes();

  const todaysEntries = useMemo(() => {
    return entries
      .filter(
        (entry) =>
          entry.day_of_week === today
      )
      .sort((a, b) => {
        return (
          timeToMinutes(a.start_time) -
          timeToMinutes(b.start_time)
        );
      });
  }, [entries, today]);

  const dayName =
    DAY_NAMES[today] ?? "Today";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
              📚
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Today&apos;s Classes
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {dayName}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/semester"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          View Full Timetable
          <span className="ml-2">→</span>
        </Link>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {todaysEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm dark:bg-slate-900">
              🎉
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              No classes today
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You have no classes scheduled
              for today.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEntries.map((entry) => {
              const course = courses.find(
                (item) =>
                  item.id ===
                  entry.course_id
              );

              const status = getStatus(
                entry,
                currentMinutes
              );

              return (
                <div
                  key={entry.id}
                  className={`relative overflow-hidden rounded-xl border p-4 transition ${
                    status === "ongoing"
                      ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : status === "completed"
                        ? "border-slate-200 bg-slate-50/70 opacity-70 dark:border-slate-700 dark:bg-slate-800/50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                  }`}
                >
                  {status ===
                    "ongoing" && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* TIME */}
                    <div className="shrink-0 sm:w-32">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatTime(
                          entry.start_time
                        )}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(
                          entry.end_time
                        )}
                      </div>
                    </div>

                    {/* COURSE */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-base font-semibold ${
                            status ===
                            "completed"
                              ? "text-slate-600 dark:text-slate-400"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {course?.name ??
                            "Unknown Course"}
                        </h3>

                        {status ===
                          "ongoing" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Ongoing
                          </span>
                        )}

                        {status ===
                          "upcoming" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Upcoming
                          </span>
                        )}

                        {status ===
                          "completed" && (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            Completed
                          </span>
                        )}
                      </div>

                      {course?.code && (
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {course.code}
                          {course.instructor
                            ? ` · ${course.instructor}`
                            : ""}
                        </p>
                      )}

                      {entry.venue && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <span aria-hidden="true">
                            📍
                          </span>
                          <span className="break-words">
                            {entry.venue}
                          </span>
                        </p>
                      )}

                      {entry.notes && (
                        <p className="mt-2 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    {/* RANGE */}
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {formatTimeRange(
                          entry.start_time,
                          entry.end_time
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}