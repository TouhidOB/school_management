"""Concrete tenant-scoped CRUD views for every admin-managed model."""
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject
from apps.attendance.models import BiometricEnrollment
from apps.exams.models import ExamSession
from apps.fees.models import FeeStructure, FeeType
from apps.ratings.models import RatingPeriod
from apps.rooms.models import ClassRoom
from apps.students.models import Student
from apps.teachers.models import Designation, TeacherProfile
from apps.web import forms
from apps.web.views.base import BaseCreate, BaseDelete, BaseList, BaseUpdate


# FK filter option builders (querysets are auto-scoped to the current tenant).
def _class_choices(self):
    return [(c.pk, c.name) for c in SchoolClass.objects.all()]


def _section_choices(self):
    return [(s.pk, str(s)) for s in Section.objects.select_related("school_class")]


def _subject_choices(self):
    return [(s.pk, s.name) for s in Subject.objects.all()]


def _designation_choices(self):
    return [(d.pk, d.name) for d in Designation.objects.all()]


def crud(model, form_class, base, headers, cells_fn, *, detail=None,
         search_fields=None, filters=None, search_placeholder="Search…"):
    """Factory: returns (List, Create, Update, Delete) view classes for a model."""
    lname, cname, ename, dname = (
        f"{base}_list", f"{base}_create", f"{base}_edit", f"{base}_delete",
    )
    List = type(f"{model.__name__}List", (BaseList,), {
        "model": model, "header": model._meta.verbose_name_plural.title(),
        "headers": headers, "create_url_name": cname, "edit_url_name": ename,
        "delete_url_name": dname, "detail_url_name": detail,
        "cells": cells_fn,
        "search_fields": search_fields or [],
        "search_placeholder": search_placeholder,
        "filters": filters or [],
    })
    Create = type(f"{model.__name__}Create", (BaseCreate,), {
        "model": model, "form_class": form_class, "list_url_name": lname,
        "header": f"New {model._meta.verbose_name.title()}",
    })
    Update = type(f"{model.__name__}Update", (BaseUpdate,), {
        "model": model, "form_class": form_class, "list_url_name": lname,
        "header": f"Edit {model._meta.verbose_name.title()}",
    })
    Delete = type(f"{model.__name__}Delete", (BaseDelete,), {
        "model": model, "list_url_name": lname,
    })
    return List, Create, Update, Delete


# ---- Academics -------------------------------------------------------------
YearList, YearCreate, YearUpdate, YearDelete = crud(
    AcademicYear, forms.AcademicYearForm, "year",
    ["Name", "Start", "End", "Current"],
    lambda self, o: [o.name, o.start_date or "—", o.end_date or "—", "Yes" if o.is_current else "No"],
)
ClassList, ClassCreate, ClassUpdate, ClassDelete = crud(
    SchoolClass, forms.SchoolClassForm, "class",
    ["Name", "Level", "Sections"],
    lambda self, o: [o.name, o.numeric_level, o.sections.count()],
)
SectionList, SectionCreate, SectionUpdate, SectionDelete = crud(
    Section, forms.SectionForm, "section",
    ["Section", "Class", "Year", "Class Teacher"],
    lambda self, o: [o.name, o.school_class.name, o.academic_year.name,
                     o.class_teacher or "—"],
)
SubjectList, SubjectCreate, SubjectUpdate, SubjectDelete = crud(
    Subject, forms.SubjectForm, "subject",
    ["Name", "Code", "Class"],
    lambda self, o: [o.name, o.code or "—",
                     o.school_class.name if o.school_class_id else "—"],
    search_fields=["name", "code"], search_placeholder="Search subjects…",
    filters=[
        {"param": "class", "label": "Class", "lookup": "school_class_id",
         "choices": _class_choices},
    ],
)

# ---- Teachers --------------------------------------------------------------
DesignationList, DesignationCreate, DesignationUpdate, DesignationDelete = crud(
    Designation, forms.DesignationForm, "designation",
    ["Name", "Rank", "Teachers"],
    lambda self, o: [o.name, o.rank_order, o.teachers.count()],
)
TeacherList, TeacherCreate, TeacherUpdate, TeacherDelete = crud(
    TeacherProfile, forms.TeacherForm, "teacher",
    ["Name", "Designation", "Employee ID", "Status"],
    lambda self, o: [str(o), o.designation or "—", o.employee_id or "—",
                     o.get_status_display()],
    detail="teacher_detail",
    search_fields=["full_name", "email", "employee_id"],
    search_placeholder="Search by name, email or ID…",
    filters=[
        {"param": "designation", "label": "Designation",
         "lookup": "designation_id", "choices": _designation_choices},
        {"param": "status", "label": "Status", "lookup": "status",
         "choices": TeacherProfile.STATUS_CHOICES},
    ],
)

# ---- Students --------------------------------------------------------------
StudentList, StudentCreate, StudentUpdate, StudentDelete = crud(
    Student, forms.StudentForm, "student",
    ["Name", "Adm. No", "Class", "Section", "Roll", "Status"],
    lambda self, o: [o.full_name, o.admission_number,
                     o.current_class.name if o.current_class_id else "—",
                     o.current_section.name if o.current_section_id else "—",
                     o.roll_number or "—", o.get_status_display()],
    detail="student_detail",
    search_fields=["full_name", "admission_number", "roll_number"],
    search_placeholder="Search by name, admission or roll…",
    filters=[
        {"param": "class", "label": "Class", "lookup": "current_class_id",
         "choices": _class_choices},
        {"param": "section", "label": "Section", "lookup": "current_section_id",
         "choices": _section_choices},
        {"param": "status", "label": "Status", "lookup": "status",
         "choices": Student.STATUS_CHOICES},
    ],
)

# ---- Rooms -----------------------------------------------------------------
RoomList, RoomCreate, RoomUpdate, RoomDelete = crud(
    ClassRoom, forms.RoomForm, "room",
    ["Name", "Subject", "Section", "Code", "Active"],
    lambda self, o: [o.name, o.subject.name, str(o.section), o.room_code,
                     "Yes" if o.is_active else "No"],
    detail="room_detail",
    search_fields=["name", "room_code", "subject__name"],
    search_placeholder="Search classrooms…",
    filters=[
        {"param": "subject", "label": "Subject", "lookup": "subject_id",
         "choices": _subject_choices},
    ],
)

# ---- Fees ------------------------------------------------------------------
FeeTypeList, FeeTypeCreate, FeeTypeUpdate, FeeTypeDelete = crud(
    FeeType, forms.FeeTypeForm, "feetype",
    ["Name", "Category", "Frequency", "Mandatory"],
    lambda self, o: [o.name, o.get_fee_category_display(),
                     o.get_frequency_display(), "Yes" if o.is_mandatory else "No"],
)
FeeStructureList, FeeStructureCreate, FeeStructureUpdate, FeeStructureDelete = crud(
    FeeStructure, forms.FeeStructureForm, "feestructure",
    ["Fee Type", "Year", "Class", "Amount"],
    lambda self, o: [o.fee_type.name, o.academic_year.name,
                     o.applicable_class.name if o.applicable_class_id else "All",
                     o.amount],
)

# ---- Ratings ---------------------------------------------------------------
PeriodList, PeriodCreate, PeriodUpdate, PeriodDelete = crud(
    RatingPeriod, forms.RatingPeriodForm, "ratingperiod",
    ["Name", "Start", "End", "Active"],
    lambda self, o: [o.name, o.start_date, o.end_date, "Yes" if o.is_active else "No"],
)

# ---- Biometric enrollments -------------------------------------------------
EnrollmentList, EnrollmentCreate, EnrollmentUpdate, EnrollmentDelete = crud(
    BiometricEnrollment, forms.BiometricEnrollmentForm, "enrollment",
    ["Device ID", "Person", "Type", "Label"],
    lambda self, o: [o.device_user_id, o.person or "—", o.kind.title(),
                     o.label or "—"],
    search_fields=["device_user_id", "label"],
    search_placeholder="Search device id or name…",
)


# ---- Exams -----------------------------------------------------------------
ExamList, ExamCreate, ExamUpdate, ExamDelete = crud(
    ExamSession, forms.ExamSessionForm, "exam",
    ["Name", "Year", "Start", "Published"],
    lambda self, o: [o.name, o.academic_year.name, o.start_date or "—",
                     "Yes" if o.is_published else "No"],
    detail="exam_detail",
)
