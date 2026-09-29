# EduNest — Feature Documentation

**Multi-Vendor School Management SaaS** · Django 5 · shared-database multi-tenancy

> 🌐 বাংলা সংস্করণ: [FEATURES.bn.md](FEATURES.bn.md)

EduNest is a "Shopify for Schools" platform. One deployment serves many schools. Each
school is an isolated **tenant** with its own subdomain, branding, users and data, while
the platform owner (Super Admin) manages every tenant from a single console.

This document covers **every feature currently implemented**, screen by screen, with
screenshots captured from the running application.

---

## Table of contents

1. [Platform at a glance](#1-platform-at-a-glance)
2. [Architecture & multi-tenancy](#2-architecture--multi-tenancy)
3. [Roles & access control](#3-roles--access-control)
4. [Public website](#4-public-website)
5. [Online admissions](#5-online-admissions)
6. [Super Admin console](#6-super-admin-console)
7. [School Admin — setup & academics](#7-school-admin--setup--academics)
8. [School Admin — staff management](#8-school-admin--staff-management)
9. [School Admin — student management](#9-school-admin--student-management)
10. [Classrooms (Google-Classroom style)](#10-classrooms-google-classroom-style)
11. [Exams & results](#11-exams--results)
12. [Attendance (manual + biometric)](#12-attendance-manual--biometric)
13. [Fees, invoices & payments](#13-fees-invoices--payments)
14. [Teacher rating system](#14-teacher-rating-system)
15. [Certificates & printable documents](#15-certificates--printable-documents)
16. [Notifications & settings](#16-notifications--settings)
17. [Teacher workspace](#17-teacher-workspace)
18. [Student portal](#18-student-portal)
19. [Parent portal](#19-parent-portal)
20. [Biometric device API](#20-biometric-device-api)
21. [Data model reference](#21-data-model-reference)
22. [Security model](#22-security-model)
23. [Tech stack & deployment](#23-tech-stack--deployment)
24. [Running the demo](#24-running-the-demo)
25. [Implemented vs. scaffolded](#25-implemented-vs-scaffolded)

---

## 1. Platform at a glance

| | |
|---|---|
| **Product** | EduNest — multi-tenant school management SaaS |
| **Tenancy model** | Shared database, shared schema, `school` FK on every tenant row |
| **Tenant resolution** | Subdomain (`greenvalley.platform.local`) or Premium custom domain |
| **Roles** | 9 (Super Admin, School Admin, Sub-Admin, Teacher, Accountant, Student, Parent, Librarian, Transport Manager) |
| **Feature modules** | 12 Django apps |
| **Screens documented** | 75 |
| **Pricing model** | Flat ৳10 per student, billed offline; Super Admin provisions manually |
| **Backend** | Django 5.0, DRF 3.15, Celery 5.4 (configured), SQLite (dev) / Postgres / MySQL |
| **Frontend** | Server-rendered Django templates + Tailwind, print-optimised report pages |

### The 12 feature modules

| App | Responsibility |
|---|---|
| `core` | Abstract base models, tenant-scoped ORM manager, tenant middleware |
| `tenants` | `School` (the tenant), `SubscriptionPlan`, `ContactMessage` sales leads |
| `accounts` | Custom `User` with role-based access control |
| `academics` | Academic years, classes, sections, subjects, weekly class routine |
| `teachers` | Designations, teacher profiles, designation history |
| `students` | Students, guardians, admission applications, transfers, certificates |
| `rooms` | Collaborative classrooms: feed, notes, assignments, submissions |
| `fees` | Fee types, fee structures, discounts, invoices, payments, invoice designs |
| `ratings` | Rating periods, anonymous teacher ratings, aggregates, leaderboards |
| `attendance` | Student/staff attendance, leave, biometric enrollment & punches |
| `exams` | Exam sessions, exam subjects, results |
| `notifications` | SMS / push / email / in-app notification log |

---

## 2. Architecture & multi-tenancy

Every tenant-owned table carries a `school` foreign key. Isolation is enforced at four
layers, so a single missed filter cannot leak data across schools.

```
Request  ─►  TenantMiddleware                      resolves the tenant
             ├─ host ends with PLATFORM_DOMAIN ──► subdomain label → School.slug
             ├─ otherwise ─────────────────────►  School.custom_domain (Premium)
             └─ authenticated non-super-admin ──►  ALWAYS pinned to user.school
                                                   (subdomain cannot override)
                  │
                  ▼
             thread-local current school  ─►  SchoolScopedManager.get_queryset()
                                              auto-filters every ORM call
                  │
                  ▼
             TenantQuerysetMixin (list/detail)  +  TenantModelForm (FK dropdowns)
```

Key components:

| Component | File | What it does |
|---|---|---|
| `SchoolScopedModel` | [apps/core/models.py](../apps/core/models.py) | Abstract base: `school` FK, `objects` (scoped) and `all_objects` (raw) managers |
| `SchoolScopedManager` | [apps/core/managers.py](../apps/core/managers.py) | Auto-filters querysets by the thread-local tenant; `.unscoped()` opts out |
| `TenantMiddleware` | [apps/core/middleware.py](../apps/core/middleware.py) | Resolves tenant from host, pins employees to their own school |
| `scope_to(school)` | [apps/core/tenant.py](../apps/core/tenant.py) | Context manager for Celery tasks / shell / management commands |
| `TenantQuerysetMixin` | [apps/web/mixins.py](../apps/web/mixins.py) | Belt-and-braces re-filter on list and detail views |
| `TenantModelForm` | [apps/web/forms.py](../apps/web/forms.py) | Scopes every FK/M2M dropdown to the current tenant |

Reserved subdomains (`www`, `app`, `admin`, `api`, `static`, `media`) and the bare
platform domain carry **no** tenant — they serve the marketing site and the Super Admin
console.

### CRUD scaffolding

Admin-managed models share a generated CRUD stack, so every list page gets the same
search, filters, pagination and actions for free:

- `crud()` factory in [apps/web/views/crud_views.py](../apps/web/views/crud_views.py)
  returns `(List, Create, Update, Delete)` classes for a model.
- `crud_paths()` in [apps/web/urls.py](../apps/web/urls.py) turns those into four URL
  patterns with consistent names (`<base>_list`, `_create`, `_edit`, `_delete`).
- Base views in [apps/web/views/base.py](../apps/web/views/base.py) add `?q=` search over
  declared fields, dropdown filters, 25-per-page pagination that preserves query params,
  and role gating.

Models wired through this factory: Academic Years, Classes, Sections, Subjects,
Designations, Teachers, Students, Classrooms, Fee Types, Fee Structures, Rating Periods,
Biometric Enrollments, Exam Sessions.

---

## 3. Roles & access control

Nine roles are defined on the custom `User` model. Every non-Super-Admin user belongs to
exactly one school.

| Role | Scope | Access |
|---|---|---|
| **Super Admin** | Platform | All schools, leads, plans; can "enter" any tenant and act as its admin |
| **School Admin** | One school | Everything within their school |
| **Sub-Admin** (Vice Principal) | One school | Same as School Admin |
| **Teacher** | One school | Own classrooms, assignments, marks entry, own ratings, attendance |
| **Accountant** | One school | Invoices, payments, receipts, student/fee read access |
| **Student** | One school | Own classrooms, assignments, results, invoices, teacher rating |
| **Parent/Guardian** | One school | Linked children's attendance, results, invoices |
| **Librarian** | One school | Role defined; no dedicated screens yet |
| **Transport Manager** | One school | Role defined; no dedicated screens yet |

Enforcement:

- Class-based views — `SchoolAdminMixin` / `RoleRequiredMixin` raise `PermissionDenied`.
- Function-based views — the `_require(request, roles)` guard.
- Super Admin bypasses per-role gates by design (platform-wide support access).
- Object-level checks where ownership matters, e.g. `_can_view_invoice()` lets a student
  see only their own invoice and a parent only their child's.

### Sign in

One login form for every role; the dashboard router sends each user to the right home
page after authentication.

![Sign in](shots/login.png)

---

## 4. Public website

The unauthenticated marketing site, served on the bare platform domain.

### Home / landing

Value proposition, feature highlights, per-student pricing and a contact CTA.

**URL:** `/`

![Home](shots/home.png)

### Features

Grid of the platform modules available to every school.

**URL:** `/features/`

![Features](shots/features.png)

### Pricing

Flat pricing — ৳10 per student, paid offline — with an inclusions list. There is no
self-service checkout: schools enquire, and the Super Admin provisions them manually.

**URL:** `/pricing/`

![Pricing](shots/pricing.png)

### Top Teachers leaderboard

Platform-wide ranking of the best-rated teachers **across all schools**. A teacher only
appears after receiving at least **5 ratings** (`MIN_RATINGS_TO_PUBLISH`), which prevents
a single rating from topping the chart. Ranked by average overall score, then volume.

**URL:** `/leaderboard/`

![Teachers leaderboard](shots/leaderboard.png)

### Top Schools leaderboard

The same idea one level up: schools ranked by the average of their teachers' ratings.
Suspended and cancelled tenants are excluded.

**URL:** `/schools-leaderboard/`

![Schools leaderboard](shots/school_leaderboard.png)

### Contact / sales enquiry

Submissions become `ContactMessage` leads in the Super Admin inbox, and can be converted
into a provisioned school in one click.

**URL:** `/contact/`

![Contact](shots/contact.png)

---

## 5. Online admissions

A complete public-to-enrolled admissions pipeline that spans the marketing site and the
school admin console.

```
Applicant                          School Admin
────────────────────────────────   ───────────────────────────────────
browse /admissions/
  │
  ├─ apply at a school ──────────► application lands as "Pending"
  │   receives tracking code            │
  │   + token URL + admit card          ├─ Approve → pick class/section/roll
  │                                     │            → Student created
  ├─ track status any time ◄────────────┤            → Guardian created
  │                                     └─ Reject  → reason recorded
  └─ print admit card
```

### Admissions directory

Public, searchable list of every school currently accepting online applications
(`admissions_open = True`, and not suspended/cancelled).

**URL:** `/admissions/`

![Admissions directory](shots/pub_admissions.png)

### Online application form

The school's own public form. The "class applying for" field is populated from that
school's real class list when it has one. On submit the applicant gets a **tracking code**
(e.g. `DEMO-2026-0001`) and an unguessable 24-character **track token**.

Schools can instead switch to **PDF mode**, where the page serves a downloadable printable
form plus instructions rather than an online form.

**URL:** `/admissions/<school-slug>/apply/`

![Admission form](shots/pub_admission_apply.png)

### Track application

Public status page reached with the token — no login required, and not enumerable.

**URL:** `/admissions/track/<token>/`

![Track application](shots/pub_admission_track.png)

### Admit card

Printable admit card issued to the applicant.

**URL:** `/admissions/track/<token>/admit-card/`

![Admit card](shots/pub_admit_card.png)

### Applications inbox (School Admin)

Status counters (total / pending / approved / rejected), search by applicant or guardian,
status filter, the shareable public application link, and a one-click open/close toggle
for admissions.

**URL:** `/app/admissions/`

![Applications inbox](shots/ad_applications.png)

### Review an application

Approving asks for placement — admission number (auto-suggested as `YYYY-NNNN`), class,
section, academic year, roll — and then creates the `Student` record, copies over the
applicant's details, and creates a `Guardian` from the guardian fields. Rejecting records
a reason. Either way the reviewer and timestamp are stored.

**URL:** `/app/admissions/<id>/`

![Review application](shots/ad_application_review.png)

### Admission form settings

Choose online vs. downloadable-PDF mode, upload the printable form, and write the
instructions applicants see.

**URL:** `/app/admissions/settings/`

![Admission settings](shots/ad_admission_settings.png)

---

## 6. Super Admin console

The platform owner's workspace. Super Admins have no home school; they operate on the
platform view, and "enter" a tenant when they need to work inside it.

### Platform dashboard

KPIs across every tenant: total schools, active / trial / suspended counts, total students
and expected revenue (students × ৳10). Below that, the contact-lead inbox with clickable
phone numbers and the most recently created schools.

**URL:** `/app/`

![Platform dashboard](shots/sa_dashboard.png)

### Schools

Every tenant, with search across name / slug / admin email and a status filter.

**URL:** `/app/schools/`

![Schools](shots/sa_schools.png)

### School detail & lifecycle

A tenant's profile and live stats (student and teacher counts), plus status controls that
move the school through its lifecycle:

`Pending Verification → Trial Active → Active → Trial Expired / Payment Failed / Suspended / Cancelled`

`School.has_access` is true only for **Trial Active** and **Active**.

From here, **Manage this school** stores the tenant in the session and drops the Super
Admin into that school's admin workspace; **Exit school** returns to the platform view.

**URL:** `/app/schools/<id>/`

![School detail](shots/sa_school_detail.png)

### Create a school

Manual provisioning in one form: school name, type, subdomain slug (uniqueness-checked),
admin name/email/password (the login is created too), country, status, and the school's
biometric device brand plus API credentials. Saving creates the tenant **and** its School
Admin account in a single step.

**URL:** `/app/schools/create/`

![Create school](shots/sa_school_create.png)

### Contact messages (leads)

Full CRUD over enquiries: search, open/handled filter, phone and email links, edit,
delete, mark handled, and **convert to school** — which pre-fills the create-school form
from the lead and links the two records once the school is created.

**URL:** `/app/leads/` · `/app/leads/<id>/`

![Leads](shots/sa_leads.png)

![Lead detail](shots/sa_lead_detail.png)

### Subscription plans

Plan definitions: tier (Trial / Basic / Standard / Premium / Enterprise), student limit
(null = unlimited), monthly and yearly price, a JSON feature map, and an active flag.
Because billing is currently offline, plans are metadata rather than an enforced paywall.

**URL:** `/app/plans/`

![Plans](shots/sa_plans.png)

---

## 7. School Admin — setup & academics

### Dashboard

Student, teacher and classroom counts, total fees collected, outstanding invoices, recent
admissions and quick actions.

**URL:** `/app/`

![Admin dashboard](shots/ad_dashboard.png)

### Setup wizard

A five-step readiness checklist computed live from the database — school profile, academic
structure, fee types, at least one teacher, at least one student — with a completion
counter. Not a blocking wizard; a progress view the admin can return to.

**URL:** `/app/onboarding/`

![Setup wizard](shots/ad_onboarding.png)

### Academic years

Sessions such as `2026` or `2026-2027`, with start/end dates and one marked current.
Unique per school.

**URL:** `/app/years/`

![Academic years](shots/ad_years.png)

### Classes

Grade levels with a `numeric_level` used for promotion ordering and consistent sorting.

**URL:** `/app/classes/`

![Classes](shots/ad_classes.png)

### Sections

Sections belong to a class **and** an academic year, and may have a class teacher. Unique
per (class, year, name).

**URL:** `/app/sections/`

![Sections](shots/ad_sections.png)

### Subjects

Searchable subject catalog with optional codes.

**URL:** `/app/subjects/`

![Subjects](shots/ad_subjects.png)

### Class routine (timetable)

A weekly grid builder, one section at a time. Each slot carries day, period number, start
and end time, subject, teacher, room, or a **break/lunch** flag for non-teaching rows.

Constraints and behaviour:

- One slot per (section, weekday, period) — enforced at the database level.
- End time must be after start time; a non-break slot must have a subject (form-level).
- Indexed by (school, section, day) and (school, teacher, day) so both the student and
  teacher views stay fast.
- The same grid automatically feeds the teacher's and the student's personal routine.

**URL:** `/app/routine/?section=<id>`

![Class routine](shots/ad_routine.png)

---

## 8. School Admin — staff management

### Designations

A freely configurable per-school designation ladder (Principal, Head Teacher, Senior
Teacher…), ordered by `rank_order` where lower is more senior.

**URL:** `/app/designations/`

![Designations](shots/ad_designations.png)

### Teacher directory

Search by name, email or employee ID; filter by designation and status
(Active / Resigned / Terminated).

**URL:** `/app/teachers/`

![Teachers](shots/ad_teachers.png)

### Add / edit a teacher

One form creates both the login account and the profile: name, email, password
(auto-generated if left blank), employee ID, designation, joining date, contract type
(Permanent / Part-time / Contract), assigned subjects and sections, basic salary and
status. Usernames are de-duplicated automatically from the email.

**URL:** `/app/teachers/create/`

![Add teacher](shots/ad_teacher_create.png)

### Teacher detail

Profile, rating summary and the classrooms the teacher is assigned to.

**URL:** `/app/teachers/<id>/`

![Teacher detail](shots/ad_teacher_detail.png)

---

## 9. School Admin — student management

### Student directory

Search by name, admission number or roll; filter by class, section and status
(Active / Transferred / Alumni / Inactive).

**URL:** `/app/students/`

![Students](shots/ad_students.png)

### Add / edit a student

Full admission record: name, admission number (unique per school), roll, date of birth,
gender, blood group, photo upload, class / section / academic year placement, admission
date and type, address, emergency contact, previous school, medical notes (admin-only) and
status.

**URL:** `/app/students/create/`

![Add student](shots/ad_student_create.png)

### Student detail

Profile plus guardians, invoices and exam results in one view, with actions for ID card,
admission slip, portal login and certificate issuance. Guardians are added from here —
relation, name, phone, email, occupation, NID, primary-contact flag and whether they may
log into the parent portal.

**URL:** `/app/students/<id>/`

![Student detail](shots/ad_student_detail.png)

### Portal login credentials

Issue or reset a student's portal account. The **login ID is permanent** once created —
the field is disabled on subsequent edits — and only the password can be changed. The
temporary password is stored on the student record so the office can print it on the
admission slip.

**URL:** `/app/students/<id>/credentials/`

![Student credentials](shots/ad_student_credentials.png)

---

## 10. Classrooms (Google-Classroom style)

A `ClassRoom` is a collaborative space keyed on **subject × section × academic year**,
with a join code, cover image, description and one or more assigned teachers.

### Classroom list & cards

Table view with search (name, code, subject) and subject filter; card view for the
signed-in user's rooms.

**URL:** `/app/rooms/` · `/app/my-rooms/`

![Classrooms](shots/ad_rooms.png)

![Classroom cards](shots/ad_myrooms.png)

### Classroom detail

Tabbed workspace containing:

- **Feed** — posts typed as Announcement, Note or Result, with file attachments and
  pinning. Only admins and the room's own teachers can post.
- **Notes** — study material with title, description, file upload, video/YouTube link,
  topic, chapter and an "important" flag that pins it to the top.
- **Assignments** — title, instructions, attachment, due date/time, total marks, publish
  toggle.
- **Participants** — enrolled students via `RoomMembership`.

**URL:** `/app/rooms/<id>/`

![Classroom detail](shots/ad_room_detail.png)

### Assignments & grading

Students submit a text answer (and files); submissions past the due date are flagged
`is_late` automatically. Teachers see every submission and enter marks and written
feedback; the grader and grading timestamp are recorded. One submission per student per
assignment is enforced.

**URL:** `/app/assignments/<id>/`

![Assignment and grading](shots/ad_assignment_detail.png)

---

## 11. Exams & results

### Exam sessions

Named sessions such as "Half-Yearly Exam 2026", tied to an academic year, with start/end
dates and a publish flag.

**URL:** `/app/exams/`

![Exams](shots/ad_exams.png)

### Exam subjects

Per session, each (subject × class) pairing gets an exam date, total marks and pass marks.
Unique per (session, subject, class).

**URL:** `/app/exams/<id>/`

![Exam detail](shots/ad_exam_detail.png)

### Marks entry

A single-page grid of every student in the class for one exam subject. Blank cells are
skipped, so partial entry is safe and re-entry updates rather than duplicates. Each result
stores marks, optional grade and grade point, an absent flag, and who entered it.

**URL:** `/app/exam-subjects/<id>/marks/`

![Marks entry](shots/te_marks.png)

---

## 12. Attendance (manual + biometric)

### Daily student attendance

Pick a section and date, then mark each student Present / Absent / Late / On Leave.
Existing marks pre-fill, and saving updates in place — one record per student per day.

**URL:** `/app/attendance/`

![Attendance](shots/ad_attendance.png)

### Staff attendance

Daily staff register for active teachers with a present flag, check-in and check-out
times, and a present-count summary.

**URL:** `/app/staff-attendance/`

![Staff attendance](shots/ad_staff_attendance.png)

### Biometric device configuration

Select the school's fingerprint device brand, enter its API key / secret / URL, and set the
**late threshold** — punches at or after this local time mark a student Late instead of
Present. The page shows the ingest URL, the per-school device token (regenerable in one
click), a count of unresolved punches, and the 20 most recent raw punches for
troubleshooting.

Supported brands: **ZKTeco**, **ESSL**, **Suprema BioStar**, **Hikvision**, **Mantra**,
and a **Generic JSON webhook** for anything else.

**URL:** `/app/devices/`

![Device settings](shots/ad_devices.png)

### Fingerprint ID enrollment

Maps a device's internal user ID to a platform person — exactly one of a student or a
teacher, validated at the form level. Without this mapping, punches are logged as
*unresolved* and can be applied later once the enrollment exists.

**URL:** `/app/biometric/`

![Biometric enrollments](shots/ad_biometric.png)

---

## 13. Fees, invoices & payments

### Fee types

Ten built-in categories — Admission, ID Card, Monthly Tuition, Exam, Annual,
Re-admission, Library, Transport, Hostel, Custom — each with a frequency (One-time /
Monthly / Per Term / Annually / Event-based), mandatory flag, active flag and display
order.

**URL:** `/app/fee-types/`

![Fee types](shots/ad_feetypes.png)

### Fee structures

The amount for a fee type in an academic year, optionally scoped to one class. Leaving the
class blank makes it apply to **all** classes.

**URL:** `/app/fee-structures/`

![Fee structures](shots/ad_feestructures.png)

### Invoices

Search by invoice number or student name, filter by status (Draft / Sent / Paid /
Partially Paid / Overdue / Cancelled).

**URL:** `/app/invoices/`

![Invoices](shots/ad_invoices.png)

### Create an invoice — auto-fill from fee structure

Pick the student, year and month; the invoice **builds its own line items** from the fee
structures matching that student's class (plus the all-classes ones), sums the subtotal
and grand total, and auto-generates the invoice number as `INV-YYYY-NNNN` if left blank.

### Invoice detail & payment recording

Line items, subtotal, discount, late fine and grand total, with the payment history
below. Recording a payment (Cash / Online / Bank Transfer, with transaction ID and
timestamp) re-totals the paid amount and flips the invoice to **Paid** or **Partially
Paid** automatically. The receiving user is stored on every payment.

**URL:** `/app/invoices/<id>/`

![Invoice detail](shots/ad_invoice_detail.png)

---

## 14. Teacher rating system

Students rate teachers **anonymously** across six dimensions on a 1–5 scale: teaching
quality, punctuality, helpfulness, assignment feedback, communication and overall.

Guardrails built into the model and views:

- One rating per (student, teacher, rating period) — enforced by a unique constraint, so
  ratings cannot be spammed.
- Ratings are only accepted while a rating period `is_active`.
- A student can only rate teachers of classrooms they are actually enrolled in.
- Text comments are **admin-visible only** — teachers never see who said what.
- A teacher's aggregate stays private until it reaches **5 ratings**, and only then can it
  appear on the public leaderboards.

### Rating periods

Named windows (e.g. "Term 1 – 2026") with start/end dates, an active flag and eligible
classes.

**URL:** `/app/rating-periods/`

![Rating periods](shots/ad_periods.png)

### School rating dashboard

Every teacher in the school ranked by average overall score with the rating count.

**URL:** `/app/ratings/`

![Ratings dashboard](shots/ad_ratings.png)

### Student rating form

The six-dimension form, shown only for the student's own teachers.

**URL:** `/app/rate-teachers/`

![Rate teachers](shots/st_rate.png)

### Teacher's own ratings

The teacher's aggregate, locked until the 5-rating threshold is met.

**URL:** `/app/my-ratings/`

![My ratings](shots/te_ratings.png)

---

## 15. Certificates & printable documents

### Certificate templates

Three types ship with default wording that admins edit before issuing: **Custom
Certificate**, **Testimonial** and **Transfer Certificate**.

Bodies support `{placeholders}` substituted at print time from the student and school
records, including gender-correct pronouns:

`{student_name}` `{first_name}` `{admission_no}` `{roll}` `{class}` `{section}`
`{section_clause}` `{dob}` `{gender}` `{school}` `{school_address}` `{date}` `{ref_no}`
`{he_she}` `{him_her}` `{his_her}` `{he_she_cap}` `{his_her_cap}`

Unknown tokens are left untouched rather than erroring.

**URL:** `/app/certificates/` · `/app/certificates/create/`

![Certificates](shots/ad_certificates.png)

![Issue certificate](shots/ad_cert_create.png)

### Printable outputs

All four reports are standalone print-optimised HTML pages — the browser's "Save as PDF"
produces the final document, so there is no PDF engine to install or maintain on the
server.

| Document | URL | Contents |
|---|---|---|
| **Money receipt** | `/app/invoices/<id>/receipt/` | School branding, line items, payments, paid/due |
| **Student ID card** | `/app/students/<id>/id-card/` | CR80 layout, photo, class/roll, admission no., QR code |
| **Admission slip** | `/app/students/<id>/admission-slip/` | Student info, portal login, full fee schedule and balance |
| **Certificate** | `/app/certificates/<id>/print/` | Ornamental certificate with substituted placeholders |

![Money receipt](shots/rp_receipt.png)

![Student ID card](shots/rp_idcard.png)

![Admission slip](shots/rp_slip.png)

![Certificate](shots/rp_cert.png)

Access is role-gated: admins and accountants can print any of these; the receipt is also
reachable by the invoice's own student and their parent.

---

## 16. Notifications & settings

### Notifications

Per-user notification log with four channels (SMS, Push, Email, In-App) and four states
(Queued, Sent, Failed, Read). The log and the in-app inbox are implemented; outbound SMS
and push gateways are not yet wired up.

**URL:** `/app/notifications/`

![Notifications](shots/ad_notifications.png)

### School settings

School profile summary: name, type, subdomain, contact details, logo, brand colour and
plan.

**URL:** `/app/settings/`

![Settings](shots/ad_settings.png)

---

## 17. Teacher workspace

### Dashboard

Assigned classrooms, pending grading count and subjects.

**URL:** `/app/`

![Teacher dashboard](shots/te_dashboard.png)

### My classrooms

Only the rooms this teacher is assigned to.

**URL:** `/app/my-rooms/`

![My classrooms](shots/te_rooms.png)

### My teaching routine

The teacher's own weekly schedule, derived automatically from the admin's routine grid.

**URL:** `/app/my-routine/`

![Teacher routine](shots/te_routine.png)

### Marks entry

Exam sessions the teacher can open to enter marks.

**URL:** `/app/marks-entry/`

![Teacher marks](shots/te_marks.png)

---

## 18. Student portal

### Dashboard

Upcoming assignments, unpaid invoices and enrolled classrooms.

**URL:** `/app/`

![Student dashboard](shots/st_dashboard.png)

### My class routine

The student's section timetable with subject, teacher and room.

**URL:** `/app/my-routine/`

![Student routine](shots/st_routine.png)

### Assignments

Every assignment across the student's rooms with submission status.

**URL:** `/app/my-assignments/`

![Student assignments](shots/st_assignments.png)

### Results

Exam results with subject and session.

**URL:** `/app/my-results/`

![Student results](shots/st_results.png)

### Fees

The student's own invoices with receipt links.

**URL:** `/app/my-invoices/`

![Student invoices](shots/st_invoices.png)

---

## 19. Parent portal

A parent is linked to one or more students through the `Guardian` record, and every parent
page groups data per child.

### Dashboard

Child cards linking through to attendance, results and fees.

**URL:** `/app/`

![Parent dashboard](shots/pa_dashboard.png)

### Attendance · Results · Fees

Last 30 attendance days per child, exam results, and invoices with receipt links.

**URLs:** `/app/child/attendance/` · `/app/child/results/` · `/app/child/invoices/`

![Parent attendance](shots/pa_attendance.png)

![Parent results](shots/pa_results.png)

![Parent invoices](shots/pa_invoices.png)

---

## 20. Biometric device API

A single public endpoint ingests fingerprint punches from any supported device brand.

```
POST /api/devices/punch/
Auth: X-Device-Token: <school.device_token>     (or ?token=)
Body: whatever that school's device brand sends
```

The token is per-school, auto-issued (40 random chars) the moment a device brand is
selected, and regenerable from the device settings page. The endpoint is CSRF-exempt
because devices have no session — so the token is the entire credential and the endpoint
must be served over HTTPS.

### Pipeline

```
POST → token → School            (401 on missing/invalid token)
            → brand adapter      (400 on unsupported brand / unparsable body)
            → list[Punch]        normalized: device_user_id, timestamp, direction, raw
            → scope_to(school)
            → ingest_punches()
                 ├─ BiometricEnrollment lookup by device_user_id
                 ├─ student → StudentAttendance (Present, or Late past the threshold)
                 ├─ teacher → StaffAttendance (earliest in, latest out)
                 └─ no match → BiometricPunch(status=unresolved)
            → {"ok": true, "received": n, "applied": n, "unresolved": n, "errors": n}
```

Every punch is persisted as a `BiometricPunch` with its raw payload and a status of
Applied / Unresolved / Duplicate / Error, giving a full audit trail and the ability to
reprocess later.

### Adapters

| Brand | Payload format |
|---|---|
| `generic` | `{"punches": [{"user_id", "timestamp", "direction"}]}` |
| `zkteco` | ADMS/ATTLOG push — tab-separated text lines, `status` 1/3/5 = check-out |
| `essl` | Same ADMS protocol as ZKTeco |
| `suprema` | BioStar 2 webhook — `{"events": [{"user_id", "datetime", "event"}]}` |
| `hikvision` | ISAPI `AccessControllerEvent` with `employeeNoString` / `attendanceStatus` |
| `mantra` | Middleware forwards the Generic JSON shape |

Every adapter also accepts the Generic JSON shape as a fallback, so an integration can be
tested before the physical device is on site. Timestamps are parsed best-effort across
several formats and made timezone-aware.

Adding a brand means writing one `parse(request) -> list[Punch]` method in
[apps/attendance/devices/adapters.py](../apps/attendance/devices/adapters.py) — the
resolution and attendance-writing pipeline is shared.

---

## 21. Data model reference

### Platform level (not tenant-scoped)

| Model | Key fields |
|---|---|
| `School` | name, slug, custom_domain, type, admin_email, logo, primary_color, plan, status, trial_ends_at, onboarding_completed, admissions_open, admission_mode/pdf/instructions, device_brand/token/api_key/api_secret/api_url, attendance_late_after |
| `SubscriptionPlan` | name, tier, student_limit, price_monthly, price_yearly, features (JSON), is_active |
| `ContactMessage` | name, school_name, email, phone, topic, message, is_handled, converted_school |
| `User` | Django `AbstractUser` + role, school, phone |

### Tenant-scoped (all inherit `SchoolScopedModel`)

| App | Models |
|---|---|
| `academics` | `AcademicYear`, `Subject`, `SchoolClass`, `Section`, `RoutineSlot` |
| `teachers` | `Designation`, `TeacherProfile`, `DesignationHistory` |
| `students` | `Student`, `Guardian`, `AdmissionApplication`, `StudentTransfer`, `Certificate` |
| `rooms` | `ClassRoom`, `RoomMembership`, `RoomPost`, `RoomPostComment`, `RoomPostReaction`, `Note`, `Assignment`, `AssignmentSubmission` |
| `fees` | `FeeType`, `FeeStructure`, `StudentFeeDiscount`, `InvoiceDesign`, `Invoice`, `Payment` |
| `ratings` | `RatingPeriod`, `TeacherRating`, `TeacherRatingAggregate` |
| `attendance` | `StudentAttendance`, `StaffAttendance`, `LeaveApplication`, `BiometricEnrollment`, `BiometricPunch` |
| `exams` | `ExamSession`, `ExamSubject`, `ExamResult` |
| `notifications` | `Notification` |

All inherit `created_at` / `updated_at` from `TimeStampedModel`.

### Notable integrity constraints

| Constraint | Prevents |
|---|---|
| `Student` unique (school, admission_number) | Duplicate admission numbers within a school |
| `Invoice` unique (school, invoice_number) | Duplicate invoice numbers |
| `StudentAttendance` unique (student, date) | Double-marking a student in one day |
| `StaffAttendance` unique (teacher, date) | Double-marking a staff member |
| `TeacherRating` unique (teacher, student, period) | Rating spam |
| `ExamResult` unique (exam_subject, student) | Duplicate marks |
| `AssignmentSubmission` unique (assignment, student) | Duplicate submissions |
| `RoutineSlot` unique (section, day, period) | Two classes in the same slot |
| `BiometricEnrollment` unique (school, device_user_id) | Ambiguous punch resolution |
| `RoomMembership` unique (room, student) | Double enrollment |
| `School.slug` / `custom_domain` unique | Tenant address collisions |

---

## 22. Security model

**Tenant isolation**

- Every tenant row carries a `school` FK; the default manager filters by it automatically.
- An authenticated employee is *always* pinned to their own school — the subdomain never
  overrides it, so a School-A user cannot reach School-B data even by visiting B's URL
  with a shared cookie or a spoofed `Host` header.
- Super Admin is the sole exception, and their active tenant lives in the session rather
  than in the URL.
- `all_objects` / `.unscoped()` exist for platform code and are documented as off-limits
  in tenant-facing code.

**Application security**

- Object-level ownership checks on shared resources (`_can_view_invoice`).
- Student portal login IDs are permanent — only passwords can be rotated.
- Admission tracking uses a 24-character random token, not a sequential ID.
- Teacher rating comments are never exposed to the rated teacher.
- Biometric device tokens are 40 random characters and regenerable.

**Deployment hardening** (active whenever `DEBUG=False`, see
[config/settings.py](../config/settings.py))

- No fallback `SECRET_KEY` and no wildcard `ALLOWED_HOSTS` — a misconfigured deploy fails
  loudly instead of silently shipping debug mode.
- `SECURE_SSL_REDIRECT`, `SECURE_PROXY_SSL_HEADER`, secure session and CSRF cookies.
- HSTS for one year with `includeSubDomains` and preload.
- `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS = DENY`.
- Wildcard `CSRF_TRUSTED_ORIGINS` for tenant subdomains.
- Console logging configured so a host without shell access is still debuggable.

---

## 23. Tech stack & deployment

| Layer | Choice |
|---|---|
| Framework | Django 5.0 |
| API | Django REST Framework 3.15 (session auth, `IsAuthenticated`, 25/page) |
| Async | Celery 5.4 + Redis — configured for bulk SMS, PDF/report generation, CSV import and invoice runs |
| Database | SQLite (dev/demo) · PostgreSQL via `psycopg` · MySQL/MariaDB via `mysqlclient` (cPanel) |
| Static files | WhiteNoise with compressed, hashed manifests |
| Images | Pillow |
| Server | Gunicorn, or Passenger via `passenger_wsgi.py` for shared hosting |
| Config | `django-environ`, all secrets in `.env` |
| Timezone | `Asia/Dhaka`, `USE_TZ=True` |

The database is chosen entirely by `DATABASE_URL`, so the same code runs on a VPS with
Postgres or on cPanel shared hosting with MySQL. SQLite is explicitly documented as
dev-only — single-writer SQLite deadlocks under concurrent multi-tenant writes.

`SERVE_MEDIA=True` lets Django serve `/media/` on hosts where Apache cannot be configured;
otherwise point the web server or CDN at `MEDIA_ROOT`.

---

## 24. Running the demo

```bash
pip install -r requirements.txt
cp .env.example .env          # set SECRET_KEY, ALLOWED_HOSTS, PLATFORM_DOMAIN
python manage.py migrate
python manage.py seed_demo    # one demo school with data for every role
python manage.py runserver
```

`seed_demo` creates **Green Valley School** with these logins (password `demo12345`):

| Login | Role |
|---|---|
| `super@demo.local` | Super Admin |
| `admin@demo.local` | School Admin |
| `teacher@demo.local` | Teacher |
| `student@demo.local` | Student |
| `parent@demo.local` | Parent |

`python manage.py create_superadmin` provisions a platform owner account separately.

### Regenerating this documentation

```bash
python manage.py runserver 127.0.0.1:8055
python docs/capture.py          # the original 59 screens
python docs/capture_extra.py    # the 16 screens added later
python docs/build_pdf.py        # → docs/EduNest-Documentation.pdf
```

---

## 25. Implemented vs. scaffolded

Being precise about this matters more than a longer feature list.

### Fully implemented (UI + logic + persistence)

Multi-tenancy and tenant isolation · role-based access for 7 active roles · public
marketing site · public teacher and school leaderboards · contact-lead capture with
convert-to-school · Super Admin school provisioning and lifecycle · enter/exit tenant
support mode · subscription plan management · online admissions end to end (public form,
tracking token, admit card, admin review, approve-to-student) · PDF-mode admission forms ·
academic years, classes, sections, subjects · weekly class routine with teacher and
student views · designations · teacher CRUD with account creation · student CRUD with
guardians · student portal credential management · classrooms with feed, notes,
assignments, submissions and grading · exam sessions, subjects and marks entry · manual
student and staff attendance · biometric device configuration, enrollment and 6-brand
punch ingestion · fee types, fee structures, auto-filled invoices, payment recording ·
anonymous 6-dimension teacher ratings with anti-spam and publication thresholds ·
certificates with placeholder substitution · four printable documents · in-app
notification log · setup wizard · search, filtering and pagination across all list views.

### Data model present, no UI yet

| Model | Intended use |
|---|---|
| `StudentFeeDiscount` | Sibling / merit / staff-ward discounts, flat or percentage |
| `InvoiceDesign` | Selectable invoice templates (classic / modern / minimal / official / premium) |
| `LeaveApplication` | Student leave requests with an approval workflow |
| `StudentTransfer` | Section-to-section transfer history |
| `DesignationHistory` | Promotion/demotion audit trail for teachers |
| `RoomPostComment`, `RoomPostReaction` | Comments and 👍/❓ reactions on room posts |

### Configured but not yet exercised

- **Celery** — broker and result backend are wired, `autodiscover_tasks()` is on, but no
  `tasks.py` exists yet. Bulk SMS, invoice runs, CSV import and report generation are the
  intended first tasks.
- **DRF** — installed and configured (session auth, pagination defaults); the only HTTP
  API today is the device-punch endpoint, which is a plain Django view.
- **`TeacherRatingAggregate`** — the denormalized table exists and its
  `MIN_RATINGS_TO_PUBLISH` threshold is used everywhere, but nothing writes to it yet;
  leaderboards and dashboards compute averages live. A Celery task recalculating
  aggregates is the natural next step.
- **Notification channels** — SMS, push and email are modelled and logged; no gateway is
  connected, so only the in-app channel actually reaches a user.
- **Payment gateway** — billing is intentionally offline (flat ৳10/student, manual
  provisioning). No checkout, no card processing.
- **Librarian / Transport Manager** — roles are defined in the RBAC enum with no dedicated
  screens.

---

## Screen index

All 75 screenshots live in [`docs/shots/`](shots/) and are catalogued with role, URL and
description in [`docs/manifest.json`](manifest.json).

| Section | Screens |
|---|---|
| Public Website | 11 |
| Super Admin | 7 |
| School Admin | 38 |
| Printable Reports | 4 |
| Teacher | 5 |
| Student | 6 |
| Parent | 4 |
| **Total** | **75** |

A print-ready PDF of the same catalogue — one page per screen — is at
[`docs/EduNest-Documentation.pdf`](EduNest-Documentation.pdf).
