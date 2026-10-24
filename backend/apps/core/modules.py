"""Centralized System Module Registry for Multi-Vendor School Management System.

This file is the single source of truth for all modules/features across both
backend enforcement and frontend SuperAdmin control.
"""

MODULE_REGISTRY = [
    # =========================================================================
    # Tier 0: Core Foundation Modules (Mandatory - Cannot be disabled)
    # =========================================================================
    {
        "key": "students",
        "name": "Students Directory",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": True,
        "dependencies": [],
        "description": "Student admissions, guardian records, student profiles, and roll registers.",
        "icon": "People",
        "default_enabled": True,
        "routes": ["/students", "/students/new", "/students/[id]"],
        "api_prefixes": ["/api/students/"],
    },
    {
        "key": "academics",
        "name": "Academic Structure",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": True,
        "dependencies": [],
        "description": "Classes, sections, academic sessions, and subject syllabus management.",
        "icon": "MenuBook",
        "default_enabled": True,
        "routes": [
            "/academics",
            "/academics/classes",
            "/academics/sections",
            "/academics/academic-years",
            "/academics/subjects",
            "/academics/departments",
            "/academics/designations",
        ],
        "api_prefixes": [
            "/api/classes/",
            "/api/sections/",
            "/api/academic-years/",
            "/api/subjects/",
        ],
    },
    {
        "key": "teachers",
        "name": "Teachers & Staff",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": True,
        "dependencies": [],
        "description": "Faculty profiles, employee IDs, department assignments, and subject allocation.",
        "icon": "Person",
        "default_enabled": True,
        "routes": ["/teachers", "/teachers/new", "/teachers/[id]", "/teachers/assign-subjects"],
        "api_prefixes": ["/api/teachers/", "/api/departments/", "/api/designations/"],
    },
    {
        "key": "schoolSettings",
        "name": "School Profile & Campuses",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": True,
        "dependencies": [],
        "description": "Institution branding, working schedule, campus branches, and ID numbering formats.",
        "icon": "Business",
        "default_enabled": True,
        "routes": ["/school-settings", "/school-settings/branches", "/settings", "/settings/roles"],
        "api_prefixes": ["/api/school/", "/api/school-settings/"],
    },

    # =========================================================================
    # Tier 1: Core Foundation Add-ons
    # =========================================================================
    {
        "key": "exStudents",
        "name": "Ex-Students & Batches",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": False,
        "dependencies": ["students"],
        "description": "Graduating batches registry, bulk graduation wizard, alumni directory, and career tracking.",
        "icon": "School",
        "default_enabled": True,
        "routes": ["/ex-students", "/ex-students/[id]"],
        "api_prefixes": ["/api/passing-batches/", "/api/alumni-profiles/"],
    },
    {
        "key": "admissions",
        "name": "Online Admissions & Intake",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": False,
        "dependencies": ["students", "academics"],
        "description": "Public admission portal, applicant form, tracking code, and review/approval workflow.",
        "icon": "AppRegistration",
        "default_enabled": True,
        "routes": ["/admissions-review", "/admissions"],
        "api_prefixes": ["/api/admissions/"],
    },
    {
        "key": "certificates",
        "name": "Certificates & ID Generator",
        "category": "core",
        "category_name": "Core Foundation",
        "is_mandatory": False,
        "dependencies": ["students"],
        "description": "Student ID card generator, Transfer Certificates (TC), and merit testimonial templates.",
        "icon": "EmojiEvents",
        "default_enabled": True,
        "routes": ["/certificates", "/certificates/types", "/certificates/generate", "/print/certificate"],
        "api_prefixes": ["/api/certificates/"],
    },

    # =========================================================================
    # Tier 2: Academic & Learning Operations (LMS)
    # =========================================================================
    {
        "key": "timetable",
        "name": "Timetable & Routines",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["academics", "teachers"],
        "description": "Weekly period scheduling, routine grid, and automated room/teacher conflict detection.",
        "icon": "CalendarMonth",
        "default_enabled": True,
        "routes": ["/timetable", "/timetable/teachers", "/timetable/conflicts", "/timetable/manage"],
        "api_prefixes": ["/api/routine-slots/"],
    },
    {
        "key": "attendance",
        "name": "Attendance & Absentee Desk",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["students", "academics"],
        "description": "Daily student classroom attendance, follow-up absentee desk, streak alerts, and leaves.",
        "icon": "FactCheck",
        "default_enabled": True,
        "routes": ["/attendance", "/attendance/absentees", "/attendance/reports", "/leaves"],
        "api_prefixes": ["/api/student-attendance/", "/api/leaves/"],
    },
    {
        "key": "homework",
        "name": "Homework & Tasks",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["students", "teachers", "academics"],
        "description": "Teacher homework assignments, digital student file submissions, and evaluation reviews.",
        "icon": "HomeWork",
        "default_enabled": True,
        "routes": ["/homework", "/homework/submissions"],
        "api_prefixes": ["/api/assignments/", "/api/assignment-submissions/"],
    },
    {
        "key": "learning",
        "name": "E-Learning & Course Materials",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["students", "teachers", "academics"],
        "description": "Interactive classroom discussion feeds, chapter notes, syllabus guidelines, and study files.",
        "icon": "AutoStories",
        "default_enabled": True,
        "routes": ["/learning", "/learning/live-classes", "/rooms"],
        "api_prefixes": ["/api/rooms/", "/api/study-materials/", "/api/online-classes/"],
    },
    {
        "key": "exams",
        "name": "Exams & Results",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["students", "academics"],
        "description": "Exam schedules, marks entry roster, automated GPA calculation, and printable grade sheets.",
        "icon": "Assignment",
        "default_enabled": True,
        "routes": ["/exams", "/exams/schedule", "/exams/marks", "/exams/results", "/exams/promotions", "/print/exam"],
        "api_prefixes": ["/api/exams/", "/api/student-promotions/"],
    },
    {
        "key": "ratings",
        "name": "Teacher Performance Ratings",
        "category": "academic",
        "category_name": "Academic & Learning",
        "is_mandatory": False,
        "dependencies": ["teachers"],
        "description": "Student and parent rating cycles, confidential teacher evaluation, and faculty scorecards.",
        "icon": "Star",
        "default_enabled": True,
        "routes": ["/ratings"],
        "api_prefixes": ["/api/ratings/"],
    },

    # =========================================================================
    # Tier 3: Finance, Treasury & Staff Payroll
    # =========================================================================
    {
        "key": "finance",
        "name": "Fee Structures & Invoices",
        "category": "finance",
        "category_name": "Finance & Treasury",
        "is_mandatory": False,
        "dependencies": ["students", "academics"],
        "description": "Fee schedules, auto-generated student invoices, discount waivers, and cash/bank receipt counter.",
        "icon": "Paid",
        "default_enabled": True,
        "routes": [
            "/finance",
            "/finance/collection",
            "/finance/fee-structure",
            "/finance/invoices",
            "/finance/discounts",
            "/finance/student-fees",
            "/finance/reports",
            "/fees",
            "/print/invoice",
        ],
        "api_prefixes": ["/api/fee-structures/", "/api/fee-types/", "/api/invoices/", "/api/payments/", "/api/fee-discounts/"],
    },
    {
        "key": "expenses",
        "name": "Campus Expenses Ledger",
        "category": "finance",
        "category_name": "Finance & Treasury",
        "is_mandatory": False,
        "dependencies": [],
        "description": "School operational expenditures, category ledgers, vendor vouchers, and audit tracking.",
        "icon": "AccountBalanceWallet",
        "default_enabled": True,
        "routes": ["/finance/expenses"],
        "api_prefixes": ["/api/expenses/", "/api/expense-categories/"],
    },
    {
        "key": "hr",
        "name": "HR & Staff Payroll",
        "category": "finance",
        "category_name": "Finance & Treasury",
        "is_mandatory": False,
        "dependencies": ["teachers"],
        "description": "Staff designations, leave approvals, salary payment vouchers, and printable pay slips.",
        "icon": "Work",
        "default_enabled": True,
        "routes": [
            "/hr",
            "/hr/staff",
            "/hr/attendance",
            "/hr/leaves",
            "/hr/designations",
            "/finance/salaries",
            "/print/salary",
        ],
        "api_prefixes": ["/api/salaries/", "/api/staff-attendance/", "/api/staff-leaves/"],
    },

    # =========================================================================
    # Tier 4: Campus Logistics & Facility Add-ons
    # =========================================================================
    {
        "key": "library",
        "name": "Library Management",
        "category": "logistics",
        "category_name": "Logistics & Facilities",
        "is_mandatory": False,
        "dependencies": ["students", "teachers"],
        "description": "Book catalog (ISBN, rack number), student library cards, book issuance, and overdue fines.",
        "icon": "LocalLibrary",
        "default_enabled": True,
        "routes": ["/library", "/library/books", "/library/issues"],
        "api_prefixes": ["/api/library/"],
    },
    {
        "key": "transport",
        "name": "Transport & Bus Fleet",
        "category": "logistics",
        "category_name": "Logistics & Facilities",
        "is_mandatory": False,
        "dependencies": ["students"],
        "description": "Bus routes, stops, pickup schedules, driver licenses, and student bus seat allocations.",
        "icon": "DirectionsBus",
        "default_enabled": True,
        "routes": ["/transport", "/transport/vehicles", "/transport/routes", "/transport/allocation"],
        "api_prefixes": ["/api/transport/"],
    },
    {
        "key": "hostel",
        "name": "Hostel & Dormitory",
        "category": "logistics",
        "category_name": "Logistics & Facilities",
        "is_mandatory": False,
        "dependencies": ["students"],
        "description": "Hostel buildings, warden contacts, room bed capacity, and student room residency allocations.",
        "icon": "Hotel",
        "default_enabled": True,
        "routes": ["/hostel", "/hostel/hostels", "/hostel/rooms", "/hostel/allocation"],
        "api_prefixes": ["/api/hostel/"],
    },
    {
        "key": "inventory",
        "name": "Inventory & Campus Assets",
        "category": "logistics",
        "category_name": "Logistics & Facilities",
        "is_mandatory": False,
        "dependencies": [],
        "description": "School stationery, equipment stock, vendor suppliers, and staff asset issuance.",
        "icon": "Inventory",
        "default_enabled": True,
        "routes": [
            "/inventory",
            "/inventory/items",
            "/inventory/categories",
            "/inventory/suppliers",
            "/inventory/issues",
        ],
        "api_prefixes": ["/api/inventory/"],
    },

    # =========================================================================
    # Tier 5: Communication, Governance & Hardware
    # =========================================================================
    {
        "key": "communication",
        "name": "Communication & Notices",
        "category": "communication",
        "category_name": "Communication & Alerts",
        "is_mandatory": False,
        "dependencies": [],
        "description": "School noticeboard, bulk broadcast announcements, and SMS/email message templates.",
        "icon": "Campaign",
        "default_enabled": True,
        "routes": ["/communication", "/communication/messages", "/settings/notifications"],
        "api_prefixes": ["/api/announcements/", "/api/notifications/", "/api/message-templates/"],
    },
    {
        "key": "events",
        "name": "Events & Academic Calendar",
        "category": "communication",
        "category_name": "Communication & Alerts",
        "is_mandatory": False,
        "dependencies": [],
        "description": "School annual calendar, holidays, sports days, cultural events, and parent-teacher meetings.",
        "icon": "Event",
        "default_enabled": True,
        "routes": ["/events", "/events/list"],
        "api_prefixes": ["/api/events/"],
    },
    {
        "key": "reports",
        "name": "Summary Reports & BI",
        "category": "governance",
        "category_name": "Reports & Governance",
        "is_mandatory": False,
        "dependencies": [],
        "description": "Cross-system reporting: academic results, treasury receipts vs dues, and staff summaries.",
        "icon": "BarChart",
        "default_enabled": True,
        "routes": ["/reports", "/reports/academic", "/reports/finance", "/reports/hr"],
        "api_prefixes": ["/api/reports/"],
    },
    {
        "key": "biometric",
        "name": "Biometric Hardware Sync",
        "category": "governance",
        "category_name": "Reports & Governance",
        "is_mandatory": False,
        "dependencies": ["attendance"],
        "description": "Hardware fingerprint & RFID integration (ZKTeco, ESSL, Suprema, Hikvision), punch ingestion.",
        "icon": "Fingerprint",
        "default_enabled": True,
        "routes": ["/biometric"],
        "api_prefixes": ["/api/biometric-enrollments/", "/api/biometric-punches/", "/api/devices/punch/"],
    },
]

MODULE_MAP = {m["key"]: m for m in MODULE_REGISTRY}

DEFAULT_MODULES = {m["key"]: m["default_enabled"] for m in MODULE_REGISTRY}

MANDATORY_MODULES = {m["key"] for m in MODULE_REGISTRY if m["is_mandatory"]}

MODULE_CATEGORIES = [
    {"key": "core", "label": "Core Foundation", "color": "#059669"},
    {"key": "academic", "label": "Academic & Learning", "color": "#0284c7"},
    {"key": "finance", "label": "Finance & Treasury", "color": "#16a34a"},
    {"key": "logistics", "label": "Logistics & Facilities", "color": "#6366f1"},
    {"key": "communication", "label": "Communication & Alerts", "color": "#d97706"},
    {"key": "governance", "label": "Reports & Governance", "color": "#7c3aed"},
]


def resolve_school_modules(school):
    """
    Computes effective module availability for a school with a 3-tier cascade:
    Effective = DEFAULT_MODULES + plan.features + school.modules (overrides).
    Mandatory modules are strictly pinned to True.
    """
    effective = dict(DEFAULT_MODULES)

    # Tier 1: Overlay Plan features if attached
    if getattr(school, "plan_id", None) and school.plan and isinstance(school.plan.features, dict):
        for k, v in school.plan.features.items():
            if k in effective and isinstance(v, bool):
                effective[k] = v

    # Tier 2: Overlay School-specific custom overrides (set by SuperAdmin)
    if isinstance(school.modules, dict):
        for k, v in school.modules.items():
            if k in effective and isinstance(v, bool):
                effective[k] = v

    # Tier 3: Enforce immutable mandatory modules
    for mandatory_key in MANDATORY_MODULES:
        effective[mandatory_key] = True

    return effective


def validate_module_dependencies(modules_dict):
    """
    Validates whether any enabled module is missing an active prerequisite dependency.
    Returns a list of warnings: [{"module": "timetable", "missing": "academics"}].
    """
    warnings = []
    for m in MODULE_REGISTRY:
        key = m["key"]
        if modules_dict.get(key, True):
            for dep in m.get("dependencies", []):
                if not modules_dict.get(dep, True):
                    dep_name = MODULE_MAP.get(dep, {}).get("name", dep)
                    warnings.append({
                        "module_key": key,
                        "module_name": m["name"],
                        "missing_dependency_key": dep,
                        "missing_dependency_name": dep_name,
                        "message": f"Module '{m['name']}' requires '{dep_name}' to be active.",
                    })
    return warnings
