from django.contrib.auth import views as auth_views
from django.urls import path

from apps.web.views import app_views as av
from apps.web.views import crud_views as cv
from apps.web.views import public as pub


def crud_paths(prefix, base, views):
    """(List, Create, Update, Delete) -> 4 url patterns with standard names."""
    List, Create, Update, Delete = views
    return [
        path(f"{prefix}/", List.as_view(), name=f"{base}_list"),
        path(f"{prefix}/create/", Create.as_view(), name=f"{base}_create"),
        path(f"{prefix}/<int:pk>/edit/", Update.as_view(), name=f"{base}_edit"),
        path(f"{prefix}/<int:pk>/delete/", Delete.as_view(), name=f"{base}_delete"),
    ]


urlpatterns = [
    # ---- public / marketing ----
    path("", pub.home, name="home"),
    path("features/", pub.features, name="features"),
    path("leaderboard/", pub.leaderboard, name="leaderboard"),
    path("admissions/", pub.admissions_directory, name="admissions"),
    path("admissions/<slug:slug>/apply/", pub.admission_apply, name="admission_apply"),
    path("admissions/track/<str:token>/", pub.admission_track, name="admission_track"),
    path("admissions/track/<str:token>/admit-card/", pub.admission_admit_card, name="admission_admit_card"),
    path("admissions/<slug:slug>/form.pdf", pub.admission_form_pdf, name="admission_form_pdf"),
    path("schools-leaderboard/", pub.school_leaderboard, name="school_leaderboard"),
    path("pricing/", pub.pricing, name="pricing"),
    path("contact/", pub.contact, name="contact"),
    path("register/", pub.register_school, name="register_school"),

    # ---- auth ----
    path("login/", auth_views.LoginView.as_view(template_name="auth/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),

    # ---- app ----
    path("app/", av.dashboard, name="dashboard"),

    # teachers
    *crud_paths("app/teachers", "teacher", (cv.TeacherList, cv.TeacherCreate, cv.TeacherUpdate, cv.TeacherDelete)),
    path("app/teachers/<int:pk>/", av.teacher_detail, name="teacher_detail"),

    # students
    *crud_paths("app/students", "student", (cv.StudentList, cv.StudentCreate, cv.StudentUpdate, cv.StudentDelete)),
    path("app/students/<int:pk>/", av.student_detail, name="student_detail"),
    path("app/students/<int:pk>/guardian/", av.guardian_add, name="guardian_add"),
    path("app/admissions/", av.application_list, name="application_list"),
    path("app/admissions/toggle/", av.admissions_toggle, name="admissions_toggle"),
    path("app/admissions/settings/", av.admission_settings, name="admission_settings"),
    path("app/admissions/<int:pk>/", av.application_review, name="application_review"),
    path("app/students/<int:pk>/id-card/", av.student_id_card, name="student_id_card"),
    path("app/students/<int:pk>/admission-slip/", av.admission_slip, name="admission_slip"),

    # academics
    *crud_paths("app/years", "year", (cv.YearList, cv.YearCreate, cv.YearUpdate, cv.YearDelete)),
    *crud_paths("app/classes", "class", (cv.ClassList, cv.ClassCreate, cv.ClassUpdate, cv.ClassDelete)),
    *crud_paths("app/sections", "section", (cv.SectionList, cv.SectionCreate, cv.SectionUpdate, cv.SectionDelete)),
    *crud_paths("app/subjects", "subject", (cv.SubjectList, cv.SubjectCreate, cv.SubjectUpdate, cv.SubjectDelete)),
    *crud_paths("app/designations", "designation", (cv.DesignationList, cv.DesignationCreate, cv.DesignationUpdate, cv.DesignationDelete)),

    # rooms
    *crud_paths("app/rooms", "room", (cv.RoomList, cv.RoomCreate, cv.RoomUpdate, cv.RoomDelete)),
    path("app/rooms/<int:pk>/", av.room_detail, name="room_detail"),
    path("app/rooms/<int:pk>/note/", av.note_add, name="note_add"),
    path("app/rooms/<int:pk>/assignment/", av.assignment_add, name="assignment_add"),
    path("app/assignments/<int:pk>/", av.assignment_detail, name="assignment_detail"),
    path("app/submissions/<int:pk>/grade/", av.grade_submission, name="grade_submission"),

    # fees
    *crud_paths("app/fee-types", "feetype", (cv.FeeTypeList, cv.FeeTypeCreate, cv.FeeTypeUpdate, cv.FeeTypeDelete)),
    *crud_paths("app/fee-structures", "feestructure", (cv.FeeStructureList, cv.FeeStructureCreate, cv.FeeStructureUpdate, cv.FeeStructureDelete)),
    path("app/invoices/", av.invoice_list, name="invoice_list"),
    path("app/invoices/create/", av.invoice_create, name="invoice_create"),
    path("app/invoices/<int:pk>/", av.invoice_detail, name="invoice_detail"),
    path("app/invoices/<int:pk>/receipt/", av.invoice_receipt, name="invoice_receipt"),

    # ratings
    *crud_paths("app/rating-periods", "ratingperiod", (cv.PeriodList, cv.PeriodCreate, cv.PeriodUpdate, cv.PeriodDelete)),
    path("app/ratings/", av.rating_dashboard, name="rating_dashboard"),

    # attendance
    path("app/attendance/", av.attendance_mark, name="attendance_mark"),
    path("app/staff-attendance/", av.staff_attendance, name="staff_attendance"),

    # class routine / timetable
    path("app/routine/", av.class_routine, name="class_routine"),
    path("app/routine/<int:pk>/delete/", av.routine_slot_delete, name="routine_slot_delete"),

    # certificates
    path("app/certificates/", av.certificate_list, name="certificate_list"),
    path("app/certificates/create/", av.certificate_form, name="certificate_create"),
    path("app/certificates/<int:pk>/edit/", av.certificate_form, name="certificate_edit"),
    path("app/certificates/<int:pk>/delete/", av.certificate_delete, name="certificate_delete"),
    path("app/certificates/<int:pk>/print/", av.certificate_print, name="certificate_print"),

    # biometric / fingerprint devices
    *crud_paths("app/biometric", "enrollment", (cv.EnrollmentList, cv.EnrollmentCreate, cv.EnrollmentUpdate, cv.EnrollmentDelete)),
    path("app/devices/", av.device_settings, name="device_settings"),

    # exams
    *crud_paths("app/exams", "exam", (cv.ExamList, cv.ExamCreate, cv.ExamUpdate, cv.ExamDelete)),
    path("app/exams/<int:pk>/", av.exam_detail, name="exam_detail"),
    path("app/exam-subjects/<int:pk>/marks/", av.marks_entry, name="marks_entry"),
    path("app/exams/<int:pk>/routine/", av.exam_routine, name="exam_routine"),
    path("app/exams/<int:pk>/admit-cards/", av.exam_admit_cards, name="exam_admit_cards"),
    path("app/exams/<int:pk>/merit/", av.exam_merit, name="exam_merit"),
    path("app/exams/<int:pk>/transcript/<int:student_pk>/", av.exam_transcript, name="exam_transcript"),
    path("app/exams/<int:pk>/promote/", av.exam_promote, name="exam_promote"),

    # super admin
    path("app/schools/", av.tenant_list, name="tenant_list"),
    path("app/schools/create/", av.school_create, name="school_create"),
    path("app/schools/<int:pk>/", av.tenant_detail, name="tenant_detail"),
    path("app/schools/<int:pk>/enter/", av.enter_school, name="enter_school"),
    path("app/exit-school/", av.exit_school, name="exit_school"),
    # contact messages / leads — full CRUD
    path("app/leads/", av.lead_list, name="lead_list"),
    path("app/leads/create/", av.lead_form, name="lead_create"),
    path("app/leads/<int:pk>/", av.lead_detail, name="lead_detail"),
    path("app/leads/<int:pk>/edit/", av.lead_form, name="lead_edit"),
    path("app/leads/<int:pk>/delete/", av.lead_delete, name="lead_delete"),
    path("app/leads/<int:pk>/handled/", av.lead_handled, name="lead_handled"),
    path("app/plans/", av.plan_list, name="plan_list"),
    path("app/plans/create/", av.plan_edit, name="plan_create"),
    path("app/plans/<int:pk>/edit/", av.plan_edit, name="plan_edit"),

    # misc
    path("app/notifications/", av.notification_list, name="notification_list"),
    path("app/onboarding/", av.onboarding, name="onboarding"),
    path("app/settings/", av.settings_page, name="settings"),
]
