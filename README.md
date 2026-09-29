# 🎓 Multi-Vendor School Management System (SaaS)

[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-red?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A modern, comprehensive, multi-tenant SaaS School Management Enterprise Resource Planning (ERP) platform. Designed for institutions of any scale—from single private schools to multi-branch academy networks—with a fully decoupled architecture featuring a **Django REST Framework** backend and a **Next.js 14 (App Router)** frontend.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Client Web Browser   │
                                  └───────────┬────────────┘
                                              │ :80 / :443
                                              ▼
                                  ┌────────────────────────┐
                                  │   Nginx Reverse Proxy  │
                                  └─────┬────────────┬─────┘
                     /api, /admin,      │            │  All other routes
                     /static, /media    │            │  (Next.js App)
                                        ▼            ▼
                   ┌────────────────────────┐    ┌────────────────────────┐
                   │    Django REST API     │    │  Next.js 14 Frontend   │
                   │    (Gunicorn / WSGI)   │    │      (SSR / React)     │
                   └───────────┬────────────┘    └────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌────────────────────────┐             ┌────────────────────────┐
│  PostgreSQL Database   │             │   Redis Task Broker    │
│  (ACID Multi-Tenant)   │             │   & Celery Workers     │
└────────────────────────┘             └────────────────────────┘
```

---

## ✨ Key Features & Modules

### 🏢 1. Multi-Tenant Architecture & Branding
- **Tenant Isolation:** Every school has isolated academic, financial, and student records via tenant scoping.
- **Custom School Branding:** Configurable school logos, primary theme colors, contact info, motto, and curriculum rules.
- **Module Toggle:** Enable or disable specific features per school (Hostel, Transport, Online Classes, Inventory, Fees).

### 👥 2. Student Information System (SIS)
- **Admission Portal:** Public application portal with live token tracking, document uploads, and multi-stage administrative approval/rejection.
- **Student Profiles & Records:** Roll numbers, admission numbers, personal/guardian details, blood group, emergency contacts.
- **Academic Promotion:** Batch grade promotion engine from one academic year to the next.
- **Branded ID Cards & Certificates:** Generate and print student ID cards and character/completion certificates.

### 📚 3. Academics & Scheduling
- **Hierarchical Structure:** Academic Years, Classes, Sections, and Departmental Subjects.
- **Weekly Routine / Timetable:** Class routine slots mapping teachers, subjects, days, and period timings.

### 🕒 4. Attendance & Leaves
- **Student Daily Attendance:** Fast class-wise attendance marking with status filters (Present, Absent, Late, Excused).
- **Biometric Integration:** Database support for biometric fingerprint/RFID punch machines and auto-logging.
- **Staff Leave Applications:** Submission and approval workflow for employee sick/casual leaves.

### 📝 5. Examinations & Grading
- **Exam Management:** Term exams, Half-Yearly, Final exams, and custom exam sessions.
- **Mark Entry & Grade Scales:** Flexible component grading (Written, MCQ, Practical, Viva) with GPA and Letter Grade calculation.
- **Printable Transcripts:** Printable academic transcripts and result summary sheets.

### 💰 6. Finance, Accounting & Cash Flow (`/finance`)
- **Central Treasury Wallet:** Live reconciliation balance:
  $$\text{Treasury Balance} = \text{Initial Balance} + \text{Collections} - \text{Salaries} - \text{Expenses}$$
- **Fee Structures:** Configurable fee categories (Tuition, Exam, Admission, Annual, Transport) assigned by school, class, or individual student.
- **1-Click Batch Invoicing:** Automatically bill entire classes with duplicate prevention.
- **Cashier Dues Collection (Pay Now):** Rapid search by roll/name, waterfall partial payment allocation across overdue invoices, and instant receipt printing.
- **Official Printable Receipts:** Watermarked due slips and invoices with school header and authorized signatures.
- **Teacher & Staff Payroll:** Monthly salary roster tracking base salary, allowances, deductions, payment methods (Cash, Bank, bKash/Nagad), and official printable payslip vouchers.
- **Institutional Expenses:** Categorized tracking of operational overheads (Utilities, Rent, Supplies).
- **Scholarships & Waivers:** Sibling discounts, merit waivers, and staff concessions.

### 💻 7. Virtual Classrooms & Additional Services
- **Online Classes & Study Materials:** Video links, class notes, and syllabus distribution.
- **Assignments & Homework:** Digital assignment submissions with teacher review.
- **Hostel & Transport Management:** Room assignments, vehicle routes, and stops.
- **Library & Book Loans:** Book catalogue, issue/return tracking.
- **Inventory Management:** School assets, equipment, and supply tracking.

### ☁️ 8. Automated Cloud Backups
- **Continuous 12-Hour Schedule:** Background daemon running via macOS `launchd` / Linux `cron`.
- **Google Drive Sync:** Automated atomic database dumping, `gzip -9` compression, pre-upload directory cleaning, and direct upload to Google Drive using `rclone`.

---

## 🛠️ Technology Stack

| Component | Technology | Version / Notes |
| :--- | :--- | :--- |
| **Backend Framework** | Python / Django | Django 5.0 |
| **API Layer** | Django REST Framework (DRF) | DRF 3.15.2, SimpleJWT 5.3.1 |
| **Frontend Framework**| Next.js | Next.js 14 (App Router) |
| **UI Components** | Material-UI (MUI) & Bootstrap | Emotion, Lucide Icons, Bootstrap 5 |
| **Database** | PostgreSQL | PostgreSQL 17 (SQLite fallback for dev) |
| **Caching & Broker** | Redis | Redis 5.0 |
| **Task Queue** | Celery | Celery 5.4 |
| **Web Server / Proxy** | Nginx & Gunicorn | Production reverse proxy & WSGI server |
| **Containerization** | Docker & Docker Compose | Multi-container stack |

---

## 📂 Project Structure

```text
├── backend/                    # Django REST API Backend
│   ├── apps/                   # Pluggable Django Apps
│   │   ├── academics/          # Classes, Sections, Subjects, Routines
│   │   ├── accounts/           # Custom User model, Roles & Permissions
│   │   ├── attendance/         # Student attendance & Biometric logs
│   │   ├── cms/                # FAQs, Contact leads, Announcements
│   │   ├── core/               # Tenant middleware & Abstract base models
│   │   ├── exams/              # Exam sessions, Marks, Grade scales
│   │   ├── fees/               # Treasury, Invoices, Payments, Salaries, Expenses
│   │   ├── hostel/             # Hostel rooms & student allotment
│   │   ├── library/            # Books, borrowing & returns
│   │   ├── notifications/      # Real-time and broadcast notices
│   │   ├── students/           # Student profiles, Admissions, ID cards
│   │   ├── teachers/           # Teachers, Staff, Departments, Payroll info
│   │   ├── tenants/            # Multi-vendor School / Tenant management
│   │   └── transport/          # Vehicles, Routes & Drivers
│   ├── config/                 # Settings, Root URLs, Celery, WSGI
│   ├── scripts/                # Automated backup scripts & rclone config
│   │   ├── backup_db.sh        # Database backup & Google Drive sync script
│   │   └── com.school.dbbackup.plist # 12-hour launchd daemon configuration
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/                   # Next.js 14 Frontend Application
│   ├── app/                    # Next.js App Router Pages
│   │   ├── (app)/              # Authenticated Portal Routes
│   │   │   ├── academics/      # Academic management UI
│   │   │   ├── attendance/     # Daily attendance sheet
│   │   │   ├── exams/          # Exam mark entry & results
│   │   │   ├── finance/        # Treasury, Collections, Invoices, Salaries
│   │   │   ├── students/       # Student directory & registration
│   │   │   └── teachers/       # Teacher directory & profiles
│   │   ├── print/              # High-resolution print templates
│   │   │   ├── invoice/        # Student fee invoices & receipts
│   │   │   ├── salary/         # Staff payslip vouchers
│   │   │   └── student/        # ID cards & due statement slips
│   │   └── login/              # Authentication screens
│   ├── components/             # Reusable React & MUI Components
│   ├── context/                # Authentication & Tenant React Context
│   ├── lib/                    # API client with JWT interceptors
│   ├── package.json
│   └── Dockerfile
├── nginx/                      # Nginx configuration
│   └── default.conf            # Reverse proxy rules
├── docker-compose.yml          # Full-stack Docker orchestration
├── .env.example                # Sample environment configurations
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Method 1: Running with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TouhidOB/school_management.git
   cd school_management
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. **Start the complete stack:**
   ```bash
   docker compose up --build -d
   ```

4. **Access the application:**
   - **Web Application:** [http://localhost](http://localhost)
   - **Django Admin:** [http://localhost/admin](http://localhost/admin)
   - **API Root:** [http://localhost/api](http://localhost/api)

---

### Method 2: Manual Local Development

#### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 14+ (or local SQLite)

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to set your DATABASE_URL, SECRET_KEY, etc.

# Run migrations and seed data
python manage.py migrate
python manage.py seed_demo  # Seeds demo school, students, teachers & admins

# Start Django development server
python manage.py runserver 8000
```

#### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Demo Accounts

If you populate demo data using `python manage.py seed_demo`:

| Role | Username / Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `super@demo.local` | `admin123` | Platform-wide administrative control, multi-school management |
| **School Admin**| `admin@demo.local` | `admin123` | Single-school operational control (Academics, Finance, SIS) |
| **Teacher**     | `teacher@demo.local` | `teacher123` | Attendance marking, marks entry, classroom materials |
| **Student**     | `student@demo.local` | `student123` | Results viewing, assignment submission, dues status |
| **Parent**      | `parent@demo.local` | `parent123` | Student academic progress, fee payment receipts |

---

## 🔄 Automated Cloud Backups Setup

The platform includes an automated backup pipeline that atomically dumps the database, applies gzip compression, and syncs directly to Google Drive:

1. Configure your Google Drive target in [`backend/scripts/rclone.conf`](file:///Users/m3air/Desktop/Files/django%20project/Multi%20Vendor%20School%20Management%20System/backend/scripts/rclone.conf):
   ```bash
   rclone config reconnect gdrive: --config "backend/scripts/rclone.conf"
   ```
2. Run manual backup test:
   ```bash
   bash backend/scripts/backup_db.sh
   ```
3. Enable the 12-hour continuous scheduler on macOS:
   ```bash
   cp backend/scripts/com.school.dbbackup.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.school.dbbackup.plist
   ```
   *(Or add `0 */12 * * * /bin/bash /path/to/backup_db.sh` to Linux crontab).*

---

## 📡 REST API Quick Reference

All tenant endpoints require Bearer JWT authentication and automatically scope records to the active school:

| Module | Endpoint | Methods | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login/` | `POST` | Authenticate & retrieve JWT tokens |
| **Auth** | `/api/auth/me/` | `GET` | Retrieve logged-in profile & school info |
| **Students** | `/api/students/` | `GET, POST` | List & register students |
| **Attendance** | `/api/attendance/` | `GET, POST` | Record daily student attendance |
| **Exams** | `/api/exam-sessions/` | `GET, POST` | Manage exam terms and grade sheets |
| **Fees** | `/api/student-dues/` | `GET` | Outstanding student balance ledger |
| **Fees** | `/api/student-dues/{id}/pay_due/` | `POST` | Record payment & generate receipt |
| **Salaries** | `/api/salary-payments/roster/` | `GET` | Monthly staff payroll schedule |
| **Salaries** | `/api/salary-payments/` | `POST` | Disburse salary & generate voucher |
| **Wallet** | `/api/school-wallet/summary/` | `GET` | Central school treasury statement |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
