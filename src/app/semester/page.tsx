   "use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";
import type {
  TimetableEntry,
  TimetableCourse,
} from "./timetable-types";
import TimetableForm from "./TimetableForm";
import TimetableGrid from "./TimetableGrid";

type Semester = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string | null;
  max_absences: number;
};

type Absence = {
  id: string;
  course_id: string;
};

type TimetableDaySchedule = {
  day: number;
  startTime: string;
  endTime: string;
  venue: string;
};

function formatPdfTime(time: string) {
  const [hourText, minuteText] = time.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }

  return hour * 60 + minute;
}

function getAcademicYear(semester: Semester) {
  if (!semester.start_date) {
    return "";
  }

  const startYear = Number(semester.start_date.slice(0, 4));

  if (!Number.isFinite(startYear)) {
    return "";
  }

  const startMonth = Number(semester.start_date.slice(5, 7));

  // Indian-style academic year: July–December belongs to
  // the academic year starting in that calendar year, while
  // January–June belongs to the academic year that started
  // in the previous calendar year.
  const academicStartYear =
    startMonth >= 7 ? startYear : startYear - 1;
  const academicEndYear = academicStartYear + 1;

  return `${academicStartYear}-${String(academicEndYear).slice(-2)}`;
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}


export default function SemesterPage() {
  const supabase = createClient();

  const [semester, setSemester] =
    useState<Semester | null>(null);

  const [semesters, setSemesters] =
    useState<Semester[]>([]);

  const [selectedSemester, setSelectedSemester] =
    useState<Semester | null>(null);

  const [selectedCourses, setSelectedCourses] =
    useState<Course[]>([]);

  const [selectedAbsences, setSelectedAbsences] =
    useState<Absence[]>([]);

  const [timetableEntries, setTimetableEntries] =
    useState<TimetableEntry[]>([]);

  const [timetableCourses, setTimetableCourses] =
    useState<TimetableCourse[]>([]);

  const [timetableLoading, setTimetableLoading] =
    useState(false);

const [showTimetableForm, setShowTimetableForm] =
  useState(false);

const [editingTimetableEntry, setEditingTimetableEntry] =
  useState<TimetableEntry | null>(null);

const [timetableCourseId, setTimetableCourseId] =
  useState("");

const [timetableDays, setTimetableDays] =
  useState<number[]>([]);

const [timetableStartTime, setTimetableStartTime] =
  useState("");

const [timetableEndTime, setTimetableEndTime] =
  useState("");

const [timetableVenue, setTimetableVenue] =
  useState("");

const [timetableNotes, setTimetableNotes] =
  useState("");

const [timetableSaving, setTimetableSaving] =
  useState(false);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(false);

  const [activatingId, setActivatingId] =
    useState<string | null>(null);

  useEffect(() => {
    loadSemesters();
  }, []);

  // =========================================================
  // LOAD ALL SEMESTERS
  // =========================================================

  async function loadSemesters() {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("semesters")
      .select(
        "id, name, start_date, end_date, is_active"
      )
      .eq("user_id", user.id)
      .order("start_date", {
        ascending: false,
        nullsFirst: false,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    const semesterList = data ?? [];

    setSemesters(semesterList);

    const activeSemester =
      semesterList.find(
        (item) => item.is_active
      ) ?? null;

    setSemester(activeSemester);

    if (activeSemester) {
      await loadTimetable(activeSemester.id);

      const {
        data: activeCourseData,
        error: activeCourseError,
      } = await supabase
        .from("courses")
        .select(
          "id, name, code, instructor, max_absences"
        )
        .eq("user_id", user.id)
        .eq("semester_id", activeSemester.id)
        .order("name");

      if (activeCourseError) {
        setMessage(
          `Failed to load current semester courses: ${activeCourseError.message}`
        );
        setSelectedCourses([]);
      } else {
        setSelectedCourses(activeCourseData ?? []);
      }
    } else {
      setTimetableEntries([]);
      setTimetableCourses([]);
      setSelectedCourses([]);
    }
  }

  // =========================================================
  // LOAD TIMETABLE FOR SEMESTER
  // =========================================================

  async function loadTimetable(semesterId: string) {
    setTimetableLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTimetableLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("timetable_entries")
      .select(
        `
          id,
          user_id,
          semester_id,
          course_id,
          day_of_week,
          start_time,
          end_time,
          venue,
          notes,
          created_at,
          courses (
            id,
            name,
            code,
            instructor
          )
        `
      )
      .eq("user_id", user.id)
      .eq("semester_id", semesterId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      setMessage(
        `Failed to load timetable: ${error.message}`
      );
      setTimetableLoading(false);
      return;
    }

    const entries: TimetableEntry[] = [];
    const courses: TimetableCourse[] = [];

    for (const item of data ?? []) {
      const course = item.courses as
        | TimetableCourse
        | TimetableCourse[]
        | null;

      const normalizedCourse = Array.isArray(course)
        ? course[0]
        : course;

      entries.push({
        id: item.id,
        user_id: item.user_id,
        semester_id: item.semester_id,
        course_id: item.course_id,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        venue: item.venue,
        notes: item.notes,
        created_at: item.created_at,
      });

      if (
        normalizedCourse &&
        !courses.some(
          (existing) =>
            existing.id === normalizedCourse.id
        )
      ) {
        courses.push(normalizedCourse);
      }
    }

    setTimetableEntries(entries);
    setTimetableCourses(courses);
    setTimetableLoading(false);
  }

  // =========================================================
  // TIMETABLE CRUD
  // =========================================================

  async function addTimetableEntry(
    semesterId: string,
    courseId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    venue: string,
    notes: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      return false;
    }

    if (endTime <= startTime) {
      setMessage("End time must be later than start time.");
      return false;
    }

    const { error } = await supabase
      .from("timetable_entries")
      .insert({
        user_id: user.id,
        semester_id: semesterId,
        course_id: courseId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        venue: venue.trim() || null,
        notes: notes.trim() || null,
      });

    if (error) {
      setMessage(
        `Failed to add timetable entry: ${error.message}`
      );
      return false;
    }

    await loadTimetable(semesterId);
    return true;
  }

  async function handleAddTimetable(
    courseId: string,
    schedules: TimetableDaySchedule[],
    notes: string
  ) {
    if (!semester) {
      setMessage("No active semester found.");
      return false;
    }

    if (schedules.length === 0) {
      setMessage("Please select at least one day.");
      return false;
    }

    setTimetableSaving(true);
    setMessage("");

    try {
      for (const schedule of schedules) {
        const success = await addTimetableEntry(
          semester.id,
          courseId,
          schedule.day,
          schedule.startTime,
          schedule.endTime,
          schedule.venue,
          notes
        );

        if (!success) {
          return false;
        }
      }

      setMessage(
        "Class added to timetable successfully."
      );
      return true;
    } finally {
      setTimetableSaving(false);
    }
  }

  function getDayName(day: number) {
    const names: Record<number, string> = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    };

    return names[day] ?? "selected day";
  }

  function handleEditTimetable(
    entry: TimetableEntry
  ) {
    setEditingTimetableEntry(entry);
    setShowTimetableForm(true);
    setMessage("");
  }

  function handleCancelTimetableForm() {
    setShowTimetableForm(false);
    setEditingTimetableEntry(null);
  }

  async function handleTimetableSubmit(
    courseId: string,
    schedules: TimetableDaySchedule[],
    notes: string
  ) {
    if (!semester) {
      setMessage("No active semester found.");
      return false;
    }

    if (schedules.length === 0) {
      setMessage("Please select at least one day.");
      return false;
    }

    setTimetableSaving(true);
    setMessage("");

    try {
      if (editingTimetableEntry) {
        const firstSchedule = schedules[0];

        const updated = await updateTimetableEntry(
          editingTimetableEntry.id,
          semester.id,
          courseId,
          firstSchedule.day,
          firstSchedule.startTime,
          firstSchedule.endTime,
          firstSchedule.venue,
          notes
        );

        if (!updated) {
          return false;
        }

        for (const schedule of schedules.slice(1)) {
          const success = await addTimetableEntry(
            semester.id,
            courseId,
            schedule.day,
            schedule.startTime,
            schedule.endTime,
            schedule.venue,
            notes
          );

          if (!success) {
            return false;
          }
        }

        setMessage(
          "Timetable class updated successfully."
        );
        return true;
      }

      return await handleAddTimetable(
        courseId,
        schedules,
        notes
      );
    } finally {
      setTimetableSaving(false);
    }
  }

  async function handleDeleteTimetable(
    entry: TimetableEntry
  ) {
    if (!semester) {
      setMessage("No active semester found.");
      return;
    }

    const course = timetableCourses.find(
      (item) => item.id === entry.course_id
    );

    const confirmed = window.confirm(
      `Delete "${course?.name ?? "this class"}" from the ${getDayName(
        entry.day_of_week
      )} timetable?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setTimetableSaving(true);
    setMessage("");

    try {
      const success = await deleteTimetableEntry(
        entry.id,
        semester.id
      );

      if (success) {
        setMessage(
          "Timetable class deleted successfully."
        );
      }
    } finally {
      setTimetableSaving(false);
    }
  }

  async function updateTimetableEntry(
    entryId: string,
    semesterId: string,
    courseId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    venue: string,
    notes: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      return false;
    }

    if (endTime <= startTime) {
      setMessage("End time must be later than start time.");
      return false;
    }

    const { error } = await supabase
      .from("timetable_entries")
      .update({
        semester_id: semesterId,
        course_id: courseId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        venue: venue.trim() || null,
        notes: notes.trim() || null,
      })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(
        `Failed to update timetable entry: ${error.message}`
      );
      return false;
    }

    await loadTimetable(semesterId);
    return true;
  }

  async function deleteTimetableEntry(
    entryId: string,
    semesterId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      return false;
    }

    const { error } = await supabase
      .from("timetable_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(
        `Failed to delete timetable entry: ${error.message}`
      );
      return false;
    }

    await loadTimetable(semesterId);
    return true;
  }

  // =========================================================
  // VALIDATE DATES
  // =========================================================

  function validateDates() {
    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      setMessage(
        "End date cannot be before the start date."
      );

      return false;
    }

    return true;
  }

  // =========================================================
  // START EDIT
  // =========================================================

  function handleStartEdit() {
    if (!semester) return;

    setName(semester.name);
    setStartDate(semester.start_date || "");
    setEndDate(semester.end_date || "");

    setMessage("");
    setEditing(true);
    setCreating(false);
    setViewing(false);
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  function handleCancelEdit() {
    setEditing(false);

    setName("");
    setStartDate("");
    setEndDate("");

    setMessage("");
  }

  // =========================================================
  // UPDATE SEMESTER
  // =========================================================

  async function handleUpdateSemester(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!semester) return;

    if (!name.trim()) {
      setMessage(
        "Semester name cannot be empty."
      );
      return;
    }

    if (!validateDates()) {
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("semesters")
      .update({
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .eq("id", semester.id)
      .eq("user_id", user.id)
      .select(
        "id, name, start_date, end_date, is_active"
      )
      .single();

    if (error) {
      setMessage(
        `Failed to update semester: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setSemester(data);

    setSemesters((current) =>
      current.map((item) =>
        item.id === data.id ? data : item
      )
    );

    setName("");
    setStartDate("");
    setEndDate("");

    setEditing(false);

    setMessage(
      "Semester updated successfully!"
    );

    setLoading(false);
  }

  // =========================================================
  // END ACTIVE SEMESTER
  // =========================================================

  async function handleEndSemester() {
    if (!semester) return;

    const confirmed = window.confirm(
      `Are you sure you want to end "${semester.name}"?\n\nYour courses and absence records will NOT be deleted. The semester will only become inactive.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    const {
      error,
    } = await supabase
      .from("semesters")
      .update({
        is_active: false,
      })
      .eq("id", semester.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(
        `Failed to end semester: ${error.message}`
      );
      setLoading(false);
      return;
    }

    const endedSemester = {
      ...semester,
      is_active: false,
    };

    setSemester(null);

    setSemesters((current) =>
      current.map((item) =>
        item.id === semester.id
          ? endedSemester
          : item
      )
    );

    setEditing(false);
    setCreating(false);

    setName("");
    setStartDate("");
    setEndDate("");

    setMessage(
      `${semester.name} has been ended. Your historical data is preserved.`
    );

    setLoading(false);
  }

  // =========================================================
  // START CREATE
  // =========================================================

  function handleStartCreating() {
    setName("");
    setStartDate("");
    setEndDate("");

    setMessage("");
    setCreating(true);
    setEditing(false);
    setViewing(false);
  }

  // =========================================================
  // CANCEL CREATE
  // =========================================================

  function handleCancelCreating() {
    setCreating(false);

    setName("");
    setStartDate("");
    setEndDate("");

    setMessage("");
  }

  // =========================================================
  // CREATE NEW SEMESTER
  // =========================================================

  async function handleCreateSemester(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Semester name cannot be empty."
      );
      return;
    }

    if (!validateDates()) {
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    // Safety check: do not create another
    // active semester.
    const {
      data: activeSemester,
      error: activeError,
    } = await supabase
      .from("semesters")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (activeError) {
      setMessage(
        `Unable to check active semester: ${activeError.message}`
      );
      setLoading(false);
      return;
    }

    if (activeSemester) {
      setMessage(
        "You already have an active semester. End it before creating a new one."
      );

      setLoading(false);

      await loadSemesters();

      setCreating(false);

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("semesters")
      .insert({
        user_id: user.id,
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: true,
      })
      .select(
        "id, name, start_date, end_date, is_active"
      )
      .single();

    if (error) {
      setMessage(
        `Failed to create semester: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setSemester(data);

    setSemesters((current) => [
      data,
      ...current,
    ]);

    setName("");
    setStartDate("");
    setEndDate("");

    setCreating(false);
    setEditing(false);
    setViewing(false);

    setMessage(
      "New semester created successfully!"
    );

    setLoading(false);
  }

  // =========================================================
  // VIEW OLD SEMESTER
  // =========================================================

  async function handleViewSemester(
    semesterToView: Semester
  ) {
    setLoading(true);
    setMessage("");

    setSelectedSemester(semesterToView);
    setSelectedCourses([]);
    setSelectedAbsences([]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    // Load courses belonging to this semester.
    const {
      data: courseData,
      error: courseError,
    } = await supabase
      .from("courses")
      .select(
        "id, name, code, instructor, max_absences"
      )
      .eq("user_id", user.id)
      .eq(
        "semester_id",
        semesterToView.id
      )
      .order("name");

    if (courseError) {
      setMessage(courseError.message);
      setLoading(false);
      return;
    }

    const courses = courseData ?? [];

    setSelectedCourses(courses);

    // Load absences for courses in this semester.
    if (courses.length > 0) {
      const courseIds = courses.map(
        (course) => course.id
      );

      const {
        data: absenceData,
        error: absenceError,
      } = await supabase
        .from("absences")
        .select("id, course_id")
        .eq("user_id", user.id)
        .in("course_id", courseIds);

      if (absenceError) {
        setMessage(absenceError.message);
        setLoading(false);
        return;
      }

      setSelectedAbsences(
        absenceData ?? []
      );
    }

    setViewing(true);
    setEditing(false);
    setCreating(false);

    setLoading(false);
  }

  // =========================================================
  // CLOSE SEMESTER VIEW
  // =========================================================

  function handleCloseView() {
    setViewing(false);
    setSelectedSemester(null);
    setSelectedCourses([]);
    setSelectedAbsences([]);
    setMessage("");
  }

  // =========================================================
  // ACTIVATE OLD SEMESTER
  // =========================================================

  async function handleActivateSemester(
    semesterToActivate: Semester
  ) {
    if (semesterToActivate.is_active) {
      return;
    }

    const currentActive =
      semesters.find(
        (item) => item.is_active
      );

    let confirmedMessage =
      `Activate "${semesterToActivate.name}"?`;

    if (currentActive) {
      confirmedMessage =
        `"${currentActive.name}" is currently active.\n\nActivating "${semesterToActivate.name}" will make "${currentActive.name}" inactive.\n\nYour courses and absences will be preserved.\n\nContinue?`;
    }

    const confirmed = window.confirm(
      confirmedMessage
    );

    if (!confirmed) {
      return;
    }

    setActivatingId(
      semesterToActivate.id
    );
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not logged in.");
      setActivatingId(null);
      return;
    }

    /*
     * Step 1:
     * Deactivate the currently active semester.
     */
    const {
      error: deactivateError,
    } = await supabase
      .from("semesters")
      .update({
        is_active: false,
      })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (deactivateError) {
      setMessage(
        `Failed to switch semester: ${deactivateError.message}`
      );

      setActivatingId(null);
      return;
    }

    /*
     * Step 2:
     * Activate the selected semester.
     */
    const {
      data: activatedSemester,
      error: activateError,
    } = await supabase
      .from("semesters")
      .update({
        is_active: true,
      })
      .eq(
        "id",
        semesterToActivate.id
      )
      .eq("user_id", user.id)
      .select(
        "id, name, start_date, end_date, is_active"
      )
      .single();

    if (activateError) {
      setMessage(
        `The old semester was deactivated, but the selected semester could not be activated: ${activateError.message}`
      );

      setActivatingId(null);

      await loadSemesters();

      return;
    }

    /*
     * Update local state.
     */
    setSemesters((current) =>
      current.map((item) => {
        if (
          item.id ===
          activatedSemester.id
        ) {
          return activatedSemester;
        }

        return {
          ...item,
          is_active: false,
        };
      })
    );

    setSemester(activatedSemester);

    setViewing(false);
    setSelectedSemester(null);
    setSelectedCourses([]);
    setSelectedAbsences([]);

    setMessage(
      `${activatedSemester.name} is now the active semester.`
    );

    setActivatingId(null);
  }

  // =========================================================
  // GET ABSENCE COUNT FOR COURSE
  // =========================================================

  function getCourseAbsenceCount(
    courseId: string
  ) {
    return selectedAbsences.filter(
      (absence) =>
        absence.course_id === courseId
    ).length;
  }

  // =========================================================
  // HISTORICAL SEMESTER SUMMARY
  // =========================================================

  function getSelectedTotalAbsences() {
    return selectedAbsences.length;
  }

  function getSelectedTotalAllowedAbsences() {
    return selectedCourses.reduce(
      (total, course) =>
        total + course.max_absences,
      0
    );
  }

  // =========================================================
  // FORM
  // =========================================================

  function renderSemesterForm() {
    const isEditing = editing;

    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900 dark:shadow-none">

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {isEditing
              ? "Edit Semester"
              : "Create Semester"}
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isEditing
              ? "Update your current semester details."
              : "Create a new active semester."}
          </p>
        </div>

        <form
          onSubmit={
            isEditing
              ? handleUpdateSemester
              : handleCreateSemester
          }
          className="space-y-5"
        >

          {/* NAME */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Semester Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              placeholder="e.g. Semester 5"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400"
            />
          </div>

          {/* START DATE */}

          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Start Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
            />
          </div>

          {/* END DATE */}

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              End Date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
            />
          </div>

          {/* BUTTONS */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Semester"}
            </button>

            <button
              type="button"
              onClick={
                isEditing
                  ? handleCancelEdit
                  : handleCancelCreating
              }
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

          </div>
        </form>

        {message && (
          <p className="mt-5 whitespace-pre-line rounded-xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {message}
          </p>
        )}
      </div>
    );
  }

  async function exportTimetableToPdf() {
    if (!semester) {
      setMessage("No active semester found.");
      return;
    }

    if (timetableEntries.length === 0) {
      setMessage("There are no timetable classes to export.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 12;
    const headerTop = 12;
    const gridTop = 45;
    const headerHeight = 10;
    const footerY = pageHeight - 8;
    const gridBottom = footerY - 8;
    const bodyTop = gridTop + headerHeight;

    const days = [
      { value: 1, label: "Monday" },
      { value: 2, label: "Tuesday" },
      { value: 3, label: "Wednesday" },
      { value: 4, label: "Thursday" },
      { value: 5, label: "Friday" },
      { value: 6, label: "Saturday" },
    ];

    const timeColumnWidth = 25;
    const dayColumnWidth =
      (pageWidth - marginX * 2 - timeColumnWidth) /
      days.length;

    const allEntries = [...timetableEntries].sort(
      (a, b) =>
        timeToMinutes(a.start_time) -
        timeToMinutes(b.start_time)
    );

    /*
     * Keep the PDF timetable consistent with the application's
     * weekly timetable: 8:00 AM to 6:00 PM.
     *
     * If a user has a class outside that range, extend the range
     * by whole hours rather than clipping the class.
     *
     * The grid itself uses ONE-HOUR rows only. Classes can still
     * start/end at exact times such as 10:30 AM or 3:15 PM; their
     * blocks are positioned proportionally inside the hourly grid.
     */
    const DEFAULT_START_MINUTES = 8 * 60;
    const DEFAULT_END_MINUTES = 18 * 60;

    const earliestEntry = Math.min(
      ...allEntries.map((entry) =>
        timeToMinutes(entry.start_time)
      )
    );

    const latestEntry = Math.max(
      ...allEntries.map((entry) =>
        timeToMinutes(entry.end_time)
      )
    );

    const minMinutes = Math.min(
      DEFAULT_START_MINUTES,
      Math.floor(earliestEntry / 60) * 60
    );

    const maxMinutes = Math.max(
      DEFAULT_END_MINUTES,
      Math.ceil(latestEntry / 60) * 60
    );

    const totalMinutes = maxMinutes - minMinutes;
    const bodyHeight = gridBottom - bodyTop;

    const timeToY = (minutes: number) =>
      bodyTop +
      ((minutes - minMinutes) / totalMinutes) *
        bodyHeight;

    const courseColors = [
      [239, 246, 255],
      [240, 253, 244],
      [255, 247, 237],
      [250, 245, 255],
      [236, 254, 255],
      [255, 241, 242],
    ];

    const courseColorMap = new Map<
      string,
      [number, number, number]
    >();

    let colorIndex = 0;

    for (const course of timetableCourses) {
      courseColorMap.set(
        course.id,
        courseColors[
          colorIndex % courseColors.length
        ] as [number, number, number]
      );
      colorIndex += 1;
    }

    const academicYear = getAcademicYear(semester);

    const generatedDate = new Intl.DateTimeFormat(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(new Date());

    // =========================================================
    // PDF HEADER
    // =========================================================

    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    pdf.text(
      "CURRENT SEMESTER TIMETABLE",
      marginX,
      headerTop + 4
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);

    const semesterMeta = academicYear
      ? `${semester.name} · Academic Year ${academicYear}`
      : semester.name;

    pdf.text(
      semesterMeta,
      marginX,
      headerTop + 11
    );

    pdf.text(
      `Generated on ${generatedDate}`,
      pageWidth - marginX,
      headerTop + 11,
      { align: "right" }
    );

    // =========================================================
    // TABLE HEADER
    // =========================================================

    pdf.setFillColor(15, 23, 42);

    pdf.rect(
      marginX,
      gridTop,
      timeColumnWidth,
      headerHeight,
      "F"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);

    pdf.text(
      "TIME",
      marginX + timeColumnWidth / 2,
      gridTop + 6.5,
      { align: "center" }
    );

    days.forEach((day, index) => {
      const x =
        marginX +
        timeColumnWidth +
        index * dayColumnWidth;

      pdf.setFillColor(15, 23, 42);

      pdf.rect(
        x,
        gridTop,
        dayColumnWidth,
        headerHeight,
        "F"
      );

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);

      pdf.text(
        day.label.toUpperCase(),
        x + dayColumnWidth / 2,
        gridTop + 6.5,
        { align: "center" }
      );
    });

    // =========================================================
    // HOURLY GRID
    // =========================================================

    /*
     * Only full-hour rows are drawn and labelled.
     * There are intentionally NO 30-minute grid rows.
     */
    for (
      let minutes = minMinutes;
      minutes <= maxMinutes;
      minutes += 60
    ) {
      const y = timeToY(minutes);

      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(
        minutes === minMinutes ||
          minutes === maxMinutes
          ? 0.35
          : 0.2
      );

      pdf.line(
        marginX,
        y,
        pageWidth - marginX,
        y
      );

      if (minutes < maxMinutes) {
        pdf.setTextColor(71, 85, 105);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);

        pdf.text(
          formatPdfTime(
            `${String(
              Math.floor(minutes / 60)
            ).padStart(2, "0")}:00`
          ),
          marginX + timeColumnWidth / 2,
          y + 3.2,
          { align: "center" }
        );
      }
    }

    // =========================================================
    // VERTICAL GRID LINES
    // =========================================================

    for (let index = 0; index <= days.length; index += 1) {
      const x =
        marginX +
        timeColumnWidth +
        index * dayColumnWidth;

      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.2);

      pdf.line(
        x,
        bodyTop,
        x,
        gridBottom
      );
    }

    pdf.setDrawColor(100, 116, 139);
    pdf.setLineWidth(0.35);

    pdf.line(
      marginX,
      bodyTop,
      marginX,
      gridBottom
    );

    // =========================================================
    // COURSE BLOCKS
    // =========================================================

    /*
     * The application allows overlapping classes on the same day.
     * Examples:
     *   - two classes at the same time
     *   - a long class containing a shorter class
     *   - two classes that partially overlap
     *
     * Build horizontal lanes for each day so overlapping entries
     * are displayed side-by-side instead of one being hidden by
     * another. Entries that do not overlap can reuse a lane.
     */
    const entriesByDay = new Map<number, TimetableEntry[]>();

    for (const entry of allEntries) {
      const current = entriesByDay.get(entry.day_of_week) ?? [];
      current.push(entry);
      entriesByDay.set(entry.day_of_week, current);
    }

    const laneInfo = new Map<
      string,
      { lane: number; laneCount: number }
    >();

    for (const day of days) {
      const dayEntries = (
        entriesByDay.get(day.value) ?? []
      ).sort(
        (a, b) =>
          timeToMinutes(a.start_time) -
            timeToMinutes(b.start_time) ||
          timeToMinutes(a.end_time) -
            timeToMinutes(b.end_time)
      );

      const laneEndTimes: number[] = [];
      const assignments: {
        entry: TimetableEntry;
        lane: number;
      }[] = [];

      for (const entry of dayEntries) {
        const start = timeToMinutes(entry.start_time);
        const end = timeToMinutes(entry.end_time);

        let lane = laneEndTimes.findIndex(
          (laneEnd) => laneEnd <= start
        );

        if (lane === -1) {
          lane = laneEndTimes.length;
          laneEndTimes.push(end);
        } else {
          laneEndTimes[lane] = end;
        }

        assignments.push({ entry, lane });
      }

      /*
       * For each entry, determine the number of lanes active at
       * any point during that entry. This makes the width exact
       * for the local overlap group instead of shrinking every
       * class on a busy day unnecessarily.
       */
      for (const assignment of assignments) {
        const entryStart = timeToMinutes(
          assignment.entry.start_time
        );
        const entryEnd = timeToMinutes(
          assignment.entry.end_time
        );

        const overlapping = assignments.filter(
          (other) => {
            const otherStart = timeToMinutes(
              other.entry.start_time
            );
            const otherEnd = timeToMinutes(
              other.entry.end_time
            );

            return (
              otherStart < entryEnd &&
              otherEnd > entryStart
            );
          }
        );

        const laneCount = Math.max(
          1,
          ...overlapping.map(
            (item) => item.lane + 1
          )
        );

        laneInfo.set(assignment.entry.id, {
          lane: assignment.lane,
          laneCount,
        });
      }
    }

    for (const entry of allEntries) {
      const dayIndex = days.findIndex(
        (day) => day.value === entry.day_of_week
      );

      if (dayIndex < 0) {
        continue;
      }

      const course = timetableCourses.find(
        (item) => item.id === entry.course_id
      );

      if (!course) {
        continue;
      }

      const startMinutes = timeToMinutes(
        entry.start_time
      );
      const endMinutes = timeToMinutes(
        entry.end_time
      );

      if (endMinutes <= startMinutes) {
        continue;
      }

      const overlap = laneInfo.get(entry.id) ?? {
        lane: 0,
        laneCount: 1,
      };

      const laneGap = 1.2;
      const dayX =
        marginX +
        timeColumnWidth +
        dayIndex * dayColumnWidth;
      const usableWidth =
        dayColumnWidth - laneGap * (overlap.laneCount + 1);
      const laneWidth =
        usableWidth / overlap.laneCount;

      const x =
        dayX +
        laneGap +
        overlap.lane * (laneWidth + laneGap);

      const y = timeToY(startMinutes) + 1.2;
      const height = Math.max(
        timeToY(endMinutes) -
          timeToY(startMinutes) -
          2.4,
        8
      );
      const width = laneWidth;

      const color =
        courseColorMap.get(entry.course_id) ??
        ([241, 245, 249] as [
          number,
          number,
          number
        ]);

      pdf.setFillColor(
        color[0],
        color[1],
        color[2]
      );
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.25);

      pdf.roundedRect(
        x,
        y,
        width,
        height,
        1.5,
        1.5,
        "FD"
      );

      const textX = x + 1.8;
      const rightX = x + width - 1.8;
      const maxTextWidth = Math.max(width - 3.6, 8);

      /*
       * PDF timetable cards intentionally show only the three most
       * useful schedule fields requested for the exported document:
       *
       *   1. Course code
       *   2. Venue / classroom
       *   3. Time
       *
       * Course name, instructor, and notes remain available in the
       * application timetable but are intentionally omitted here.
       */
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(overlap.laneCount > 1 ? 6.8 : 7.4);
      pdf.text(course.code, textX, y + 4.2);

      const timeLabel = `${formatPdfTime(
        entry.start_time
      )} – ${formatPdfTime(entry.end_time)}`;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(51, 65, 85);

      /*
       * Keep venue and time on the same bottom row for compact cards.
       * For larger cards, venue gets its own line while time remains
       * anchored to the bottom-right. This prevents the two fields
       * from overlapping even when several classes share a day.
       */
      if (entry.venue) {
        pdf.setFontSize(height < 16 ? 4.8 : 5.4);

        const venueLabel = `Venue: ${entry.venue}`;
        const availableVenueWidth = Math.max(
          width - 3.6 -
            pdf.getTextWidth(timeLabel) -
            3,
          8
        );

        const venueLines = pdf.splitTextToSize(
          venueLabel,
          availableVenueWidth
        ) as string[];

        if (height >= 16) {
          pdf.text(
            venueLines.slice(0, 1),
            textX,
            y + 8.2
          );
        } else {
          pdf.text(
            venueLines.slice(0, 1),
            textX,
            y + height - 1.8
          );
        }
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(height < 16 ? 4.8 : 5.2);
      pdf.setTextColor(51, 65, 85);

      pdf.text(
        timeLabel,
        rightX,
        y + height - 1.8,
        { align: "right" }
      );
    }

    // =========================================================
    // OUTER BORDER
    // =========================================================

    pdf.setDrawColor(100, 116, 139);
    pdf.setLineWidth(0.35);

    pdf.rect(
      marginX,
      gridTop,
      pageWidth - marginX * 2,
      gridBottom - gridTop
    );

    // =========================================================
    // FOOTER
    // =========================================================

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);

    pdf.line(
      marginX,
      footerY - 3,
      pageWidth - marginX,
      footerY - 3
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);

    pdf.text(
      `${semester.name} · Timetable · Generated on ${generatedDate}`,
      marginX,
      footerY
    );

    pdf.text(
      "Page 1",
      pageWidth - marginX,
      footerY,
      { align: "right" }
    );

    // =========================================================
    // DOWNLOAD
    // =========================================================

    const semesterName =
      sanitizeFileName(semester.name) ||
      "Current-Semester";

    const yearPart = academicYear
      ? `-${academicYear}`
      : "";

    pdf.save(
      `${semesterName}-Timetable${yearPart}.pdf`
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">

      <div className="mx-auto w-full max-w-5xl">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Semester
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Create, manage, and view your semesters
          </p>
        </div>

        {/* GLOBAL MESSAGE */}

        {message && !editing && !creating && !viewing && (
          <div className="mb-6 rounded-xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {message}
          </div>
        )}

        {/* =================================================
            EDIT / CREATE FORM
        ================================================= */}

        {editing || creating ? (
          renderSemesterForm()
        ) : viewing ? (

          /* =================================================
             SEMESTER HISTORY VIEW
          ================================================= */

          <div className="space-y-6">

            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Semester Details
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedSemester?.name}
                  </h2>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Inactive
                </span>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Start Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {selectedSemester?.start_date ||
                      "Not set"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    End Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {selectedSemester?.end_date ||
                      "Not set"}
                  </p>
                </div>

              </div>

              {/* HISTORICAL SUMMARY */}

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Semester Summary
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">

                  {/* COURSES */}

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Courses
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedCourses.length}
                    </p>
                  </div>

                  {/* TOTAL ABSENCES */}

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Absences
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {getSelectedTotalAbsences()}
                    </p>
                  </div>

                  {/* TOTAL ALLOWED */}

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Allowed
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {getSelectedTotalAllowedAbsences()}
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={handleCloseView}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ← Back
                </button>

                {selectedSemester && (
                  <button
                    type="button"
                    onClick={() =>
                      handleActivateSemester(
                        selectedSemester
                      )
                    }
                    disabled={
                      activatingId ===
                      selectedSemester.id
                    }
                    className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    {activatingId ===
                    selectedSemester.id
                      ? "Activating..."
                      : "Activate Semester"}
                  </button>
                )}

              </div>
            </div>

            {/* COURSES IN OLD SEMESTER */}

            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">

              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Courses
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Courses belonging to this semester
              </p>

              {selectedCourses.length === 0 ? (
                <div className="mt-5 rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No courses were added to this semester.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">

                  {selectedCourses.map(
                    (course) => {
                      const absenceCount =
                        getCourseAbsenceCount(
                          course.id
                        );

                      const remaining =
                        Math.max(
                          course.max_absences -
                            absenceCount,
                          0
                        );

                      return (
                        <div
                          key={course.id}
                          className="rounded-xl border border-slate-200 p-5 dark:border-slate-700 dark:bg-slate-800"
                        >

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {course.name}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Code: {course.code}
                              </p>

                              {course.instructor && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  Instructor:{" "}
                                  {course.instructor}
                                </p>
                              )}
                            </div>

                            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {absenceCount}{" "}
                              {absenceCount === 1
                                ? "absence"
                                : "absences"}
                            </span>

                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">

                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Maximum
                              </p>

                              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                {course.max_absences}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Taken
                              </p>

                              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                {absenceCount}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Remaining
                              </p>

                              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                {remaining}
                              </p>
                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>
          </div>

        ) : (

          /* =================================================
             NORMAL SEMESTER PAGE
          ================================================= */

          <div className="space-y-8">

            {/* ACTIVE SEMESTER */}

            {semester ? (
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Current Semester
                    </p>

                    <h2 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                      {semester.name}
                    </h2>
                  </div>

                  <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                    Active
                  </span>

                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Start Date
                    </p>

                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {semester.start_date ||
                        "Not set"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      End Date
                    </p>

                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {semester.end_date ||
                        "Not set"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Status
                    </p>

                    <p className="mt-1 font-medium text-green-600 dark:text-green-400">
                      Active
                    </p>
                  </div>

                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Edit Semester
                  </button>

                  <button
                    type="button"
                    onClick={handleEndSemester}
                    disabled={loading}
                    className="flex-1 rounded-xl border border-red-300 px-4 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {loading
                      ? "Ending..."
                      : "End Semester"}
                  </button>

                </div>

                {/* =================================================
                    CURRENT SEMESTER TIMETABLE
                ================================================= */}

                <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        Current Semester Timetable
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage your weekly class schedule.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={exportTimetableToPdf}
                        disabled={
                          timetableLoading ||
                          timetableEntries.length === 0
                        }
                        className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Export PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (showTimetableForm) {
                            handleCancelTimetableForm();
                          } else {
                            setEditingTimetableEntry(null);
                            setShowTimetableForm(true);
                            setMessage("");
                          }
                        }}
                        className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      >
                        {showTimetableForm
                          ? "Close"
                          : "+ Add Class"}
                      </button>
                    </div>

                  </div>

                  {showTimetableForm && (
                    <TimetableForm
                      courses={selectedCourses}
                      initialEntry={editingTimetableEntry}
                      onSubmit={handleTimetableSubmit}
                      onCancel={handleCancelTimetableForm}
                    />
                  )}

                  <div className="mt-6">
                    {timetableLoading ? (
                      <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Loading timetable...
                        </p>
                      </div>
                    ) : (
                      <TimetableGrid
                        entries={timetableEntries}
                        courses={timetableCourses}
                        onEdit={handleEditTimetable}
                        onDelete={handleDeleteTimetable}
                      />
                    )}
                  </div>

                </div>

              </div>
            ) : (
              /* NO ACTIVE SEMESTER */

              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">

                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  No Active Semester
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-slate-500 dark:text-slate-400">
                  There is currently no active semester.
                  Create a new semester or activate one
                  from your previous semesters.
                </p>

                <button
                  type="button"
                  onClick={handleStartCreating}
                  className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Create New Semester
                </button>

              </div>
            )}

            {/* =================================================
                PREVIOUS SEMESTERS
            ================================================= */}

            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Previous Semesters
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    View your old semesters and reactivate one
                    if necessary.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {
                    semesters.filter(
                      (item) =>
                        !item.is_active
                    ).length
                  }{" "}
                  inactive
                </span>

              </div>

              {semesters.filter(
                (item) => !item.is_active
              ).length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No previous semesters yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">

                  {semesters
                    .filter(
                      (item) =>
                        !item.is_active
                    )
                    .map((oldSemester) => (
                      <div
                        key={oldSemester.id}
                        className="rounded-xl border border-slate-200 p-5 dark:border-slate-700 dark:bg-slate-800"
                      >

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {oldSemester.name}
                              </h3>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                Inactive
                              </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                              {oldSemester.start_date ||
                                "No start date"}{" "}
                              →{" "}
                              {oldSemester.end_date ||
                                "No end date"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">

                            <button
                              type="button"
                              onClick={() =>
                                handleViewSemester(
                                  oldSemester
                                )
                              }
                              disabled={
                                loading ||
                                activatingId !== null
                              }
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleActivateSemester(
                                  oldSemester
                                )
                              }
                              disabled={
                                loading ||
                                activatingId !== null
                              }
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                              {activatingId ===
                              oldSemester.id
                                ? "Activating..."
                                : "Activate"}
                            </button>

                          </div>

                        </div>

                      </div>
                    ))}

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </main>
  );
}