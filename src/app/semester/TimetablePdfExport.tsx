"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

import type {
  TimetableCourse,
  TimetableEntry,
} from "./timetable-types";

type SemesterInfo = {
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type TimetablePdfExportProps = {
  semester: SemesterInfo;
  entries: TimetableEntry[];
  courses: TimetableCourse[];
  disabled?: boolean;
};

type PdfEntryLayout = {
  entry: TimetableEntry;
  column: number;
  totalColumns: number;
};

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 18 * 60;

const PAGE_MARGIN = 10;
const HEADER_HEIGHT = 31;
const DAY_HEADER_HEIGHT = 10;
const FOOTER_HEIGHT = 9;

const TIME_COLUMN_WIDTH = 18;

const COURSE_COLORS = [
  {
    fill: [232, 240, 254],
    border: [99, 130, 190],
    title: [30, 64, 110],
  },
  {
    fill: [235, 247, 239],
    border: [92, 145, 105],
    title: [35, 91, 48],
  },
  {
    fill: [250, 241, 226],
    border: [190, 143, 72],
    title: [116, 73, 22],
  },
  {
    fill: [242, 235, 249],
    border: [139, 105, 166],
    title: [91, 55, 116],
  },
  {
    fill: [235, 244, 247],
    border: [80, 139, 157],
    title: [34, 84, 99],
  },
  {
    fill: [249, 235, 235],
    border: [178, 105, 105],
    title: [117, 50, 50],
  },
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}:00`;
}

function formatTime(time: string) {
  const minutes = timeToMinutes(time);
  return formatMinutes(minutes);
}

function formatMinutes(minutes: number) {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const suffix =
    hours24 >= 12 ? "PM" : "AM";

  const hours12 =
    hours24 % 12 === 0
      ? 12
      : hours24 % 12;

  return `${hours12}:${String(mins).padStart(
    2,
    "0"
  )} ${suffix}`;
}

function formatTimeRange(
  startTime: string,
  endTime: string
) {
  return `${formatTime(startTime)} – ${formatTime(
    endTime
  )}`;
}

function getCourse(
  courses: TimetableCourse[],
  courseId: string
) {
  return courses.find(
    (course) => course.id === courseId
  );
}

function getAcademicYear(
  semester: SemesterInfo
) {
  if (!semester.start_date) {
    return null;
  }

  const startDate = new Date(
    `${semester.start_date}T00:00:00`
  );

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const startYear =
    startDate.getFullYear();

  const academicStartYear =
    startDate.getMonth() >= 6
      ? startYear
      : startYear - 1;

  const academicEndYear =
    academicStartYear + 1;

  return `${academicStartYear}-${String(
    academicEndYear
  ).slice(-2)}`;
}

function getSafeFilenamePart(
  value: string
) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getCourseColor(
  courseId: string,
  courses: TimetableCourse[]
) {
  const index = Math.max(
    courses.findIndex(
      (course) => course.id === courseId
    ),
    0
  );

  return COURSE_COLORS[
    index % COURSE_COLORS.length
  ];
}

function floorToHalfHour(minutes: number) {
  return Math.floor(minutes / 30) * 30;
}

function ceilToHalfHour(minutes: number) {
  return Math.ceil(minutes / 30) * 30;
}

function getTimeRange(
  entries: TimetableEntry[]
) {
  let start = DAY_START_MINUTES;
  let end = DAY_END_MINUTES;

  if (entries.length > 0) {
    const minimumStart = Math.min(
      ...entries.map((entry) =>
        timeToMinutes(entry.start_time)
      )
    );

    const maximumEnd = Math.max(
      ...entries.map((entry) =>
        timeToMinutes(entry.end_time)
      )
    );

    start = Math.min(
      DAY_START_MINUTES,
      floorToHalfHour(minimumStart)
    );

    end = Math.max(
      DAY_END_MINUTES,
      ceilToHalfHour(maximumEnd)
    );
  }

  if (end <= start) {
    end = start + 60;
  }

  return {
    start,
    end,
  };
}

function getOverlappingLayouts(
  entries: TimetableEntry[]
): PdfEntryLayout[] {
  const sorted = [...entries].sort(
    (a, b) => {
      const startDifference =
        timeToMinutes(a.start_time) -
        timeToMinutes(b.start_time);

      if (startDifference !== 0) {
        return startDifference;
      }

      return (
        timeToMinutes(b.end_time) -
        timeToMinutes(a.end_time)
      );
    }
  );

  const groups: TimetableEntry[][] = [];

  let currentGroup: TimetableEntry[] = [];
  let currentGroupEnd = -1;

  for (const entry of sorted) {
    const start = timeToMinutes(
      entry.start_time
    );
    const end = timeToMinutes(
      entry.end_time
    );

    if (
      currentGroup.length === 0 ||
      start < currentGroupEnd
    ) {
      currentGroup.push(entry);
      currentGroupEnd = Math.max(
        currentGroupEnd,
        end
      );
    } else {
      groups.push(currentGroup);

      currentGroup = [entry];
      currentGroupEnd = end;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const result: PdfEntryLayout[] = [];

  for (const group of groups) {
    const columnEnds: number[] = [];
    const layouts: PdfEntryLayout[] = [];

    for (const entry of group) {
      const start = timeToMinutes(
        entry.start_time
      );

      let column = columnEnds.findIndex(
        (columnEnd) =>
          start >= columnEnd
      );

      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(
          timeToMinutes(entry.end_time)
        );
      } else {
        columnEnds[column] =
          timeToMinutes(entry.end_time);
      }

      layouts.push({
        entry,
        column,
        totalColumns: 0,
      });
    }

    const totalColumns =
      columnEnds.length;

    for (const layout of layouts) {
      layout.totalColumns =
        totalColumns;
      result.push(layout);
    }
  }

  return result;
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  if (!text.trim()) {
    return 0;
  }

  const lines = doc.splitTextToSize(
    text,
    maxWidth
  ) as string[];

  const visibleLines = lines.slice(
    0,
    maxLines
  );

  for (
    let index = 0;
    index < visibleLines.length;
    index += 1
  ) {
    doc.text(
      visibleLines[index],
      x,
      y + index * lineHeight
    );
  }

  return visibleLines.length;
}

function drawFooter(
  doc: jsPDF,
  semester: SemesterInfo,
  pageNumber: number,
  totalPages: number
) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const academicYear =
    getAcademicYear(semester);

  const footerText = [
    semester.name,
    academicYear
      ? `Academic Year ${academicYear}`
      : null,
    "Timetable",
  ]
    .filter(Boolean)
    .join(" · ");

  doc.setDrawColor(
    210,
    216,
    225
  );

  doc.setLineWidth(0.2);

  doc.line(
    PAGE_MARGIN,
    pageHeight - FOOTER_HEIGHT,
    pageWidth - PAGE_MARGIN,
    pageHeight - FOOTER_HEIGHT
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    105,
    116,
    130
  );

  doc.text(
    `${footerText} · Generated ${new Date().toLocaleDateString()}`,
    PAGE_MARGIN,
    pageHeight - 4
  );

  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth - PAGE_MARGIN,
    pageHeight - 4,
    {
      align: "right",
    }
  );
}

function drawPageHeader(
  doc: jsPDF,
  semester: SemesterInfo,
  continuation: boolean
) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const academicYear =
    getAcademicYear(semester);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.setTextColor(
    75,
    88,
    104
  );

  doc.text(
    "ABSENT",
    PAGE_MARGIN,
    12
  );

  doc.setFontSize(19);

  doc.setTextColor(
    25,
    35,
    48
  );

  doc.text(
    continuation
      ? "CURRENT SEMESTER TIMETABLE — CONTINUED"
      : "CURRENT SEMESTER TIMETABLE",
    PAGE_MARGIN,
    22
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    92,
    104,
    120
  );

  const subtitle = [
    semester.name,
    academicYear
      ? `Academic Year ${academicYear}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  doc.text(
    subtitle || "Current Semester",
    PAGE_MARGIN,
    28
  );

  doc.setTextColor(
    110,
    121,
    135
  );

  doc.text(
    new Date().toLocaleDateString(),
    pageWidth - PAGE_MARGIN,
    12,
    {
      align: "right",
    }
  );
}

function drawTimetablePage(
  doc: jsPDF,
  entries: TimetableEntry[],
  courses: TimetableCourse[],
  timeStart: number,
  timeEnd: number
) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const contentTop =
    PAGE_MARGIN + HEADER_HEIGHT;

  const gridWidth =
    pageWidth - PAGE_MARGIN * 2;

  const gridHeight =
    pageHeight -
    contentTop -
    FOOTER_HEIGHT -
    PAGE_MARGIN;

  const dayWidth =
    (gridWidth - TIME_COLUMN_WIDTH) /
    DAYS.length;

  const bodyHeight =
    gridHeight - DAY_HEADER_HEIGHT;

  const totalMinutes =
    timeEnd - timeStart;

  const pixelsPerMinute =
    bodyHeight / totalMinutes;

  const gridLeft = PAGE_MARGIN;
  const gridTop = contentTop;

  // ---------------------------------------------------------
  // GRID BACKGROUND
  // ---------------------------------------------------------

  doc.setFillColor(
    248,
    250,
    252
  );

  doc.rect(
    gridLeft,
    gridTop,
    gridWidth,
    gridHeight,
    "F"
  );

  // ---------------------------------------------------------
  // DAY HEADER
  // ---------------------------------------------------------

  doc.setFillColor(
    233,
    238,
    245
  );

  doc.rect(
    gridLeft,
    gridTop,
    gridWidth,
    DAY_HEADER_HEIGHT,
    "F"
  );

  doc.setDrawColor(
    188,
    198,
    211
  );

  doc.setLineWidth(0.3);

  doc.rect(
    gridLeft,
    gridTop,
    gridWidth,
    gridHeight
  );

  // Time header

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    78,
    91,
    108
  );

  doc.text(
    "TIME",
    gridLeft +
      TIME_COLUMN_WIDTH / 2,
    gridTop + 6.5,
    {
      align: "center",
    }
  );

  // Day headers

  DAYS.forEach(
    (day, index) => {
      const x =
        gridLeft +
        TIME_COLUMN_WIDTH +
        index * dayWidth;

      doc.setFontSize(8);

      doc.setTextColor(
        35,
        48,
        64
      );

      doc.text(
        day.label,
        x + dayWidth / 2,
        gridTop + 6.5,
        {
          align: "center",
        }
      );

      if (index < DAYS.length - 1) {
        doc.setDrawColor(
          202,
          211,
          222
        );

        doc.line(
          x + dayWidth,
          gridTop,
          x + dayWidth,
          gridTop + gridHeight
        );
      }
    }
  );

  // ---------------------------------------------------------
  // TIME GRID
  // ---------------------------------------------------------

  const halfHourCount =
    Math.ceil(totalMinutes / 30);

  for (
    let index = 0;
    index <= halfHourCount;
    index += 1
  ) {
    const minutes =
      timeStart + index * 30;

    if (minutes > timeEnd) {
      break;
    }

    const y =
      gridTop +
      DAY_HEADER_HEIGHT +
      (minutes - timeStart) *
        pixelsPerMinute;

    const isHour =
      minutes % 60 === 0;

    doc.setDrawColor(
      isHour ? 193 : 225,
      isHour ? 203 : 231,
      isHour ? 216 : 236
    );

    doc.setLineWidth(
      isHour ? 0.3 : 0.15
    );

    doc.line(
      gridLeft,
      y,
      gridLeft + gridWidth,
      y
    );

    if (
      minutes <
      timeEnd
    ) {
      doc.setFont(
        "helvetica",
        isHour
          ? "bold"
          : "normal"
      );

      doc.setFontSize(
        isHour ? 6.5 : 5.5
      );

      doc.setTextColor(
        104,
        116,
        132
      );

      doc.text(
        formatMinutes(minutes),
        gridLeft +
          TIME_COLUMN_WIDTH -
          2,
        y - 0.8,
        {
          align: "right",
        }
      );
    }
  }

  // Vertical separator after time column

  doc.setDrawColor(
    188,
    198,
    211
  );

  doc.setLineWidth(0.4);

  doc.line(
    gridLeft + TIME_COLUMN_WIDTH,
    gridTop,
    gridLeft + TIME_COLUMN_WIDTH,
    gridTop + gridHeight
  );

  // ---------------------------------------------------------
  // COURSE BLOCKS
  // ---------------------------------------------------------

  DAYS.forEach(
    (day, dayIndex) => {
      const dayEntries =
        entries.filter(
          (entry) =>
            entry.day_of_week ===
            day.value
        );

      const layouts =
        getOverlappingLayouts(
          dayEntries
        );

      const dayX =
        gridLeft +
        TIME_COLUMN_WIDTH +
        dayIndex * dayWidth;

      for (const layout of layouts) {
        const entry =
          layout.entry;

        const start =
          timeToMinutes(
            entry.start_time
          );

        const end =
          timeToMinutes(
            entry.end_time
          );

        const visibleStart =
          Math.max(
            start,
            timeStart
          );

        const visibleEnd =
          Math.min(
            end,
            timeEnd
          );

        if (
          visibleEnd <=
          visibleStart
        ) {
          continue;
        }

        const columnWidth =
          dayWidth /
          layout.totalColumns;

        const blockX =
          dayX +
          layout.column *
            columnWidth +
          1.2;

        const blockY =
          gridTop +
          DAY_HEADER_HEIGHT +
          (visibleStart -
            timeStart) *
            pixelsPerMinute +
          1.2;

        const blockWidth =
          columnWidth - 2.4;

        const blockHeight =
          (visibleEnd -
            visibleStart) *
            pixelsPerMinute -
          2.4;

        if (
          blockWidth <= 4 ||
          blockHeight <= 4
        ) {
          continue;
        }

        const course =
          getCourse(
            courses,
            entry.course_id
          );

        const palette =
          getCourseColor(
            entry.course_id,
            courses
          );

        doc.setFillColor(
          palette.fill[0],
          palette.fill[1],
          palette.fill[2]
        );

        doc.setDrawColor(
          palette.border[0],
          palette.border[1],
          palette.border[2]
        );

        doc.setLineWidth(0.35);

        doc.roundedRect(
          blockX,
          blockY,
          blockWidth,
          blockHeight,
          1.5,
          1.5,
          "FD"
        );

        const padding = 2;

        const textX =
          blockX + padding;

        const textWidth =
          Math.max(
            blockWidth -
              padding * 2,
            5
          );

        let cursorY =
          blockY + 4;

        const courseName =
          course?.name ??
          "Unknown Course";

        const courseCode =
          course?.code ?? "";

        const instructor =
          course?.instructor ?? "";

        const venue =
          entry.venue?.trim() ??
          "";

        const notes =
          entry.notes?.trim() ??
          "";

        // Course name

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(7);

        doc.setTextColor(
          palette.title[0],
          palette.title[1],
          palette.title[2]
        );

        const nameLines =
          doc.splitTextToSize(
            courseName,
            textWidth
          ) as string[];

        const maxNameLines =
          blockHeight >= 20
            ? 2
            : 1;

        const visibleNameLines =
          nameLines.slice(
            0,
            maxNameLines
          );

        visibleNameLines.forEach(
          (line) => {
            doc.text(
              line,
              textX,
              cursorY
            );

            cursorY += 3.2;
          }
        );

        // Course code

        if (
          courseCode &&
          cursorY <
            blockY +
              blockHeight -
              3
        ) {
          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(5.8);

          doc.setTextColor(
            75,
            87,
            102
          );

          doc.text(
            courseCode,
            textX,
            cursorY
          );

          cursorY += 3;
        }

        // Time

        if (
          cursorY <
          blockY +
            blockHeight -
            3
        ) {
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(5.7);

          doc.setTextColor(
            78,
            91,
            108
          );

          doc.text(
            formatTimeRange(
              entry.start_time,
              entry.end_time
            ),
            textX,
            cursorY
          );

          cursorY += 3;
        }

        // Instructor

        if (
          instructor &&
          blockHeight >= 15 &&
          cursorY <
            blockY +
              blockHeight -
              3
        ) {
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(5.4);

          doc.setTextColor(
            86,
            99,
            115
          );

          const instructorLines =
            doc.splitTextToSize(
              instructor,
              textWidth
            ) as string[];

          const instructorVisible =
            instructorLines.slice(
              0,
              blockHeight >= 25
                ? 2
                : 1
            );

          instructorVisible.forEach(
            (line) => {
              if (
                cursorY <
                blockY +
                  blockHeight -
                  2
              ) {
                doc.text(
                  line,
                  textX,
                  cursorY
                );

                cursorY += 2.7;
              }
            }
          );
        }

        // Venue

        if (
          venue &&
          blockHeight >= 18 &&
          cursorY <
            blockY +
              blockHeight -
              3
        ) {
          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(5.5);

          doc.setTextColor(
            65,
            78,
            94
          );

          doc.text(
            venue,
            textX,
            cursorY
          );

          cursorY += 2.8;
        }

        // Notes

        if (
          notes &&
          blockHeight >= 27 &&
          cursorY <
            blockY +
              blockHeight -
              3
        ) {
          doc.setFont(
            "helvetica",
            "italic"
          );

          doc.setFontSize(5);

          doc.setTextColor(
            102,
            112,
            125
          );

          drawWrappedText(
            doc,
            notes,
            textX,
            cursorY,
            textWidth,
            2.4,
            2
          );
        }
      }
    }
  );
}

export default function TimetablePdfExport({
  semester,
  entries,
  courses,
  disabled = false,
}: TimetablePdfExportProps) {
  const [exporting, setExporting] =
    useState(false);

  async function handleExport() {
    if (exporting || disabled) {
      return;
    }

    setExporting(true);

    try {
      const {
        start,
        end,
      } = getTimeRange(entries);

      /*
       * A4 landscape has enough vertical space for a
       * 10-hour timetable at a readable scale.
       *
       * If a future timetable extends beyond that range,
       * split it into multiple pages rather than making
       * the text unreadably small.
       */
      const PAGE_MINUTES = 10 * 60;

      const pageRanges: Array<{
        start: number;
        end: number;
      }> = [];

      let pageStart = start;

      while (pageStart < end) {
        const pageEnd = Math.min(
          pageStart + PAGE_MINUTES,
          end
        );

        pageRanges.push({
          start: pageStart,
          end: pageEnd,
        });

        pageStart = pageEnd;
      }

      if (pageRanges.length === 0) {
        pageRanges.push({
          start: DAY_START_MINUTES,
          end: DAY_END_MINUTES,
        });
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const academicYear =
        getAcademicYear(semester);

      doc.setProperties({
        title: `${semester.name} Timetable`,
        subject:
          "Current Semester Timetable",
        author: "Absent",
        creator: "Absent",
        keywords:
          "timetable, semester, academic schedule",
      });

      for (
        let pageIndex = 0;
        pageIndex <
        pageRanges.length;
        pageIndex += 1
      ) {
        if (pageIndex > 0) {
          doc.addPage(
            "a4",
            "landscape"
          );
        }

        const range =
          pageRanges[pageIndex];

        drawPageHeader(
          doc,
          semester,
          pageIndex > 0
        );

        drawTimetablePage(
          doc,
          entries,
          courses,
          range.start,
          range.end
        );

        drawFooter(
          doc,
          semester,
          pageIndex + 1,
          pageRanges.length
        );
      }

      const semesterPart =
        getSafeFilenamePart(
          semester.name
        );

      const yearPart =
        academicYear
          ? `-${academicYear}`
          : "";

      const filename =
        semesterPart
          ? `${semesterPart}-Timetable${yearPart}.pdf`
          : "Current-Semester-Timetable.pdf";

      doc.save(filename);
    } catch (error) {
      console.error(
        "Failed to export timetable PDF:",
        error
      );

      window.alert(
        "Unable to export the timetable PDF. Please try again."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={
        disabled || exporting
      }
      className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {exporting
        ? "Exporting..."
        : "Export PDF"}
    </button>
  );
}