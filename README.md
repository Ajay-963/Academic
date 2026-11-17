# Academic

> 🎓 Stop guessing. Start tracking. **Academic** is the smart way for students to stay on top of their semesters, courses, timetables, and absences — know exactly how many classes you can miss before it matters.

## 🌐 Live Application

**Production:** [https://absence-sigma.vercel.app](https://absence-sigma.vercel.app)

**GitHub Repository:** [https://github.com/Ajay-963/Academic](https://github.com/Ajay-963/Academic)

---

## 📌 Overview

Academic is a full-stack student academic management application built with **Next.js 15**, **React 19**, and **Supabase**.

The core idea is simple:

- Create and manage semesters.
- Add courses to the active semester.
- Build a weekly class timetable.
- Define the maximum number of absences allowed for each course.
- Record, edit, and delete absences.
- See how many absences remain for each course.
- Monitor semester health from the dashboard.
- View today's classes at a glance.
- Receive recovery recommendations when approaching or reaching an absence limit.
- Export your timetable as a PDF.
- Preserve completed semesters so historical data can be viewed and previous semesters can be reactivated.

The application is designed around a **maximum allowed absences** model. It does not calculate attendance percentage from total classes conducted — it focuses directly on answering: *"How many more absences can I take?"*

---

## ✨ Features

### 🔐 Authentication

- User signup and login
- Password reset via email
- Persistent authenticated sessions
- Protected application routes
- User-specific database access
- Supabase Authentication

---

### 📊 Dashboard

The Dashboard provides a high-level view of the active semester.

**Summary Statistics:**

| Card | Data |
|------|------|
| Total Courses | Number of courses in the active semester |
| Total Absences | Sum of all absences across courses |
| Absences Remaining | Sum of remaining allowances |
| Semester Health | Overall status (Excellent / Good / Warning / Critical) |

**Semester Health Indicators:**

| Status | Meaning |
|--------|---------|
| 🟢 Safe | More than 2 absences remaining |
| 🟡 Warning | 1–2 absences remaining |
| 🔴 Critical | 0 absences remaining |

**Course Attendance Overview** — each course displays a progress bar, absences used vs. allowed, remaining count, and status badge.

**Recovery Recommendations** — context-aware advice based on your semester health.

**Today's Classes** — shows classes scheduled for today from your timetable, with course name, time, room, and instructor.

**Recent Absences** — expandable section showing the last 5 absence records.

---

### 📚 Semester Management

Users can manage their academic semesters from a dedicated page.

**Active semester** displays:
- Semester name, start date, end date
- Active status badge
- Edit and End/Deactivate actions

**Previous semesters** are preserved (not deleted) and support:
- Historical view with course count, total absences, and allowed absences
- Per-course absence breakdown
- Reactivation
- Permanent deletion

Only one semester can be active at a time.

---

### 📖 Course Management

Courses belong to a specific semester. Users can:

- Add, edit, and delete courses
- Set course name, code, instructor, and maximum allowed absences
- View per-course absence usage with status indicators

```text
Computer Networks
Code: CS301

Maximum Allowed Absences: 10
Absences Taken: 4
Absences Remaining: 6
Status: 🟢 Safe
```

---

### 📝 Absence Management

Users can record absences against courses in the active semester.

Each absence includes:
- Course selection
- Date
- Reason (from saved reasons or custom)
- Optional note

Features:
- Add, edit, and delete absences
- Saved reasons library (personal, reusable)
- Custom reason with option to save for later
- Maximum absence protection (prevents exceeding the limit)
- Per-course absence summary with status

---

### 🗓️ Timetable Management

Build and manage a weekly class timetable for the active semester.

**Timetable Grid:**
- Weekly calendar view (Monday–Sunday)
- Color-coded course blocks
- Shows course name, code, time, room, and instructor
- Click to add or edit entries

**Timetable Entry Form:**
- Course selection
- Day of the week
- Start and end time
- Room/location
- Instructor (auto-populated from course)

**PDF Export:**
- Download your timetable as a formatted PDF
- Table layout with days as columns and time slots as rows
- Color-coded to match the grid

---

### 👤 Profile

- View account information (email, join date, last sign-in)
- Academic statistics: total semesters, courses, absences
- Semester history with per-semester breakdown
- Change password
- Sign out

---

### ⚙️ Settings

- **Appearance**: Light/Dark mode toggle with persistent preference
- **Absence Reasons**: Manage saved reasons (add, edit, delete)
- **Account**: Change password, view email
- **Data Management**: Export data, delete account
- **About**: App version and information

---

### 🌓 Dark Mode

- Light and dark themes
- Toggle from navbar or settings
- Persistent selection via localStorage

---

### 📱 Responsive Design

The UI is fully responsive across:
- Desktop
- Laptop
- Tablet
- Mobile

The navbar adapts with a mobile hamburger menu and slide-down navigation.

---

## 🔒 Security

The application uses **Supabase Row Level Security (RLS)**.

Every table is protected so that users can only access their own data:

- Profiles
- Semesters
- Courses
- Absences
- Absence Reasons
- Timetable

```text
User A                    User B
  │                         │
  ├── Own semesters         ├── Own semesters
  ├── Own courses           ├── Own courses
  ├── Own absences          ├── Own absences
  ├── Own timetable         ├── Own timetable
  └── Own absence reasons   └── Own absence reasons
```

RLS policies enforce SELECT, INSERT, UPDATE, and DELETE isolation per user.

---

## 🏗️ Application Architecture

```text
Browser
   │
   ▼
Next.js 15 Application
   │
   ├── Authentication
   │       │
   │       ▼
   │    Supabase Auth
   │
   ├── UI / Pages
   │       ├── Landing Page
   │       ├── Dashboard
   │       ├── Semester (+ Timetable)
   │       ├── Courses
   │       ├── Absences
   │       ├── Profile
   │       ├── Settings
   │       ├── Login
   │       ├── Signup
   │       └── Reset Password
   │
   └── Supabase Client
           │
           ▼
      Supabase Database
           │
           └── PostgreSQL + RLS
```

---

## 🗂️ Project Structure

```text
Academic/
│
├── src/
│   ├── app/
│   │   ├── absences/
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── AcademicLogo.tsx
│   │   │   └── Navbar.tsx
│   │   │
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── TodaysClasses.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   │
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   │
│   │   ├── semester/
│   │   │   ├── page.tsx
│   │   │   ├── timetable-types.ts
│   │   │   ├── TimetableForm.tsx
│   │   │   ├── TimetableGrid.tsx
│   │   │   └── TimetablePdfExport.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   │
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   │
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── server.ts
│   │
│   └── proxy.ts
│
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql
│
├── public/
│
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend / Database

- **Supabase** (PostgreSQL)
- **Supabase Authentication**
- **Row Level Security (RLS)**

### PDF Export

- **jsPDF** + **jspdf-autotable**

### Deployment

- **Vercel**

### Version Control

- **Git** + **GitHub**

---

## 🗃️ Data Model

```text
User
 │
 ├─────────────────┐
 │                 │
 ▼                 ▼
Profile          Semester
                   │
                   ├────────────┐
                   │            │
                   ▼            ▼
                Course      Timetable
                   │
                   ▼
                Absence
```

There is also a user-specific absence reasons collection:

```text
User
 │
 ▼
Absence Reasons
```

### Database Tables

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `profiles` | id, email, full_name | Auto-created on signup via trigger |
| `semesters` | name, start_date, end_date, is_active | Only one active at a time |
| `courses` | name, code, instructor, max_absences | Belongs to a semester |
| `absences` | date, reason, note | Belongs to a course |
| `absence_reasons` | reason | User's reusable reasons |
| `timetable` | day, start_time, end_time, room, instructor | Weekly schedule entries |

All tables use UUIDs, have RLS policies, and cascade deletes where appropriate.

---

## 🧮 Absence Calculation Model

For each course:

```text
Remaining Absences = Maximum Allowed Absences − Absences Taken
```

Course status:

| Remaining | Status |
|-----------|--------|
| > 2 | 🟢 Safe |
| 1–2 | 🟡 Warning |
| 0 | 🔴 Critical |

Overall semester health is derived from the worst-performing course.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **npm**
- **Git**
- A **Supabase** project

---

### 1. Clone the repository

```bash
git clone https://github.com/Ajay-963/Academic.git
cd Academic
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> [!CAUTION]
> Never commit `.env.local`. The `.gitignore` already excludes `.env*` files.
> Do not expose service-role keys or server secrets in client-side variables.

---

### 4. Set up the database

Run the migration file located at `supabase/migrations/0001_initial_schema.sql` in your Supabase SQL editor to create all tables, RLS policies, triggers, and indexes.

---

### 5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🧪 Production Build

```bash
npm run build
```

A successful build should finish without TypeScript or compilation errors.

---

## ☁️ Deployment

The application is deployed using **Vercel**.

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Install dependencies
   ├── Build Next.js application
   └── Deploy
        │
        ▼
Production Application
```

Environment variables must be configured in Vercel project settings since `.env.local` is not committed.

---

## 🔄 Development Workflow

```text
1. Make a change
      ↓
2. Run the application (npm run dev)
      ↓
3. Test locally
      ↓
4. Build (npm run build)
      ↓
5. Commit and push
      ↓
6. Vercel deploys automatically
      ↓
7. Test production
```

---

## 🧠 Design Decisions

### Why maximum allowed absences?

The project focuses on the student's absence allowance instead of requiring students to track total classes conducted, classes attended, and attendance percentage. This directly answers: *"How many more absences can I take?"*

### Why keep completed semesters?

Ending a semester preserves its data as historical records. Previous semesters can be viewed or reactivated without data loss.

### Why timetable management?

A timetable gives students a complete view of their weekly schedule alongside absence tracking, with the dashboard showing today's classes for quick reference.

---

## 📈 Future Improvements

### v1.1
- Improved landing page
- Application branding/logo refinement
- Improved mobile navigation
- Better notifications

### v1.2
- Attendance trends and analytics
- Calendar view
- Data export enhancements
- Semester statistics

### v2.0
- Progressive Web App (PWA)
- Installable mobile experience
- Push notifications/reminders
- Advanced recovery planning
- Advanced analytics

---

## 🎯 Project Goal

Academic gives students a simple place to answer three questions:

```text
1. What courses am I taking?
2. How many absences have I used?
3. How many more absences can I take?
```

The Dashboard turns those numbers into simple health indicators and actionable recommendations.

---

## 📄 Version

**Current version:** v1.0 — Academic MVP

**Status:** Production / Live

**Deployment:** Vercel

**Database & Authentication:** Supabase

---

## 👨‍💻 Author

Built as a full-stack web application using modern JavaScript/TypeScript tooling and a managed PostgreSQL backend.

**Repository:** [https://github.com/Ajay-963/Academic](https://github.com/Ajay-963/Academic)

---

## License

No license has currently been specified for this project.
