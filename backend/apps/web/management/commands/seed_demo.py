"""Populate one demo school with data, for local exploration.

    python manage.py seed_demo

Creates login accounts (all password `demo12345`):
    admin@demo.local     School Admin
    super@demo.local     Super Admin (platform owner)

Teachers, students and parents are data records only — they have no logins.
"""
from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.academics.models import AcademicYear, SchoolClass, Section, Subject
from apps.core.tenant import scope_to
from apps.exams.models import ExamResult, ExamSession, ExamSubject
from apps.fees.models import FeeStructure, FeeType, Invoice
from apps.ratings.models import RatingPeriod
from apps.rooms.models import ClassRoom, RoomMembership
from apps.students.models import Guardian, Student
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import School, SubscriptionPlan

User = get_user_model()
PW = "demo12345"


class Command(BaseCommand):
    help = "Seed a demo school (admin-only logins)."

    def handle(self, *args, **opts):
        plans = self._plans()
        school, created = School.objects.get_or_create(
            slug="demo",
            defaults=dict(name="Green Valley School", school_type="secondary",
                          admin_email="admin@demo.local", country="Bangladesh",
                          plan=plans["standard"], status=School.STATUS_TRIAL,
                          trial_ends_at=timezone.now() + timedelta(days=14)),
        )
        if not created:
            self.stdout.write("Demo school already exists — updating data.")
        su, _ = User.objects.get_or_create(
            username="super@demo.local",
            defaults=dict(email="super@demo.local", role=User.ROLE_SUPER_ADMIN,
                          is_staff=True, is_superuser=True, first_name="Platform"),
        )
        su.set_password(PW)
        su.is_staff = su.is_superuser = True
        su.save()

        with scope_to(school):
            self._build(school)
        self.stdout.write(self.style.SUCCESS(
            "Seeded. Log in at /login/ as admin@demo.local or "
            "super@demo.local (password: demo12345)"))

    def _plans(self):
        specs = [
            ("Basic", "basic", 300, 20, 192),
            ("Standard", "standard", 1000, 55, 528),
            ("Premium", "premium", None, 120, 1152),
            ("Free Trial", "trial", 50, 0, 0),
        ]
        out = {}
        for name, tier, limit, m, y in specs:
            out[tier] = SubscriptionPlan.objects.get_or_create(
                tier=tier, defaults=dict(name=name, student_limit=limit,
                                         price_monthly=m, price_yearly=y))[0]
        return out

    def _build(self, school):
        admin, _ = User.objects.get_or_create(
            username="admin@demo.local",
            defaults=dict(email="admin@demo.local",
                          role=User.ROLE_SCHOOL_ADMIN, school=school,
                          first_name="Amina", last_name="Rahman"))
        admin.set_password(PW)
        admin.role = User.ROLE_SCHOOL_ADMIN
        admin.school = school
        admin.save()

        year, _ = AcademicYear.objects.get_or_create(
            school=school, name="2026",
            defaults=dict(start_date=date(2026, 1, 1), end_date=date(2026, 12, 31),
                          is_current=True))

        c9 = SchoolClass.objects.get_or_create(school=school, name="Class 9",
                                               defaults=dict(numeric_level=9))[0]
        SchoolClass.objects.get_or_create(school=school, name="Class 10",
                                          defaults=dict(numeric_level=10))

        math = Subject.objects.get_or_create(
            school=school, school_class=c9, name="Mathematics",
            defaults=dict(code="MATH-9"))[0]
        sci = Subject.objects.get_or_create(
            school=school, school_class=c9, name="Science",
            defaults=dict(code="SCI-9"))[0]
        eng = Subject.objects.get_or_create(
            school=school, school_class=c9, name="English",
            defaults=dict(code="ENG-9"))[0]

        desig = Designation.objects.get_or_create(
            school=school, name="Senior Teacher", defaults=dict(rank_order=1))[0]
        teacher, _ = TeacherProfile.objects.get_or_create(
            school=school, employee_id="T-001",
            defaults=dict(full_name="Karim Hossain",
                          email="karim@demo.local", phone="01700000001",
                          designation=desig, joining_date=date(2024, 1, 10)))
        if not teacher.full_name:
            teacher.full_name = "Karim Hossain"
            teacher.save(update_fields=["full_name"])
        teacher.subjects.add(math, sci)

        sec = Section.objects.get_or_create(
            school=school, school_class=c9, academic_year=year, name="A",
            defaults=dict(class_teacher=teacher))[0]
        teacher.sections.add(sec)

        roster = [
            ("2026-001", "1", "Sadia Islam", "female"),
            ("2026-002", "2", "Md Rasel Hossain", "male"),
            ("2026-003", "3", "Nusrat Jahan", "female"),
            ("2026-004", "4", "Tanvir Ahmed", "male"),
            ("2026-005", "5", "Farhana Akter", "female"),
        ]
        students = []
        for adm, roll, name, gender in roster:
            s, _ = Student.objects.get_or_create(
                school=school, admission_number=adm,
                defaults=dict(full_name=name, roll_number=roll, gender=gender,
                              current_class=c9, current_section=sec,
                              academic_year=year,
                              admission_date=date(2026, 1, 5)))
            students.append(s)
        Guardian.objects.get_or_create(
            school=school, student=students[0], relation="father",
            defaults=dict(name="Nurul Islam", phone="017000000",
                          occupation="Businessman", is_primary_contact=True))

        room, _ = ClassRoom.objects.get_or_create(
            school=school, room_code="MATH9A",
            defaults=dict(name="Class 9A — Mathematics", subject=math,
                          section=sec, academic_year=year, created_by=admin))
        room.teachers.add(teacher)
        for s in students[:2]:
            RoomMembership.objects.get_or_create(school=school, room=room,
                                                 student=s)

        # Fees
        tuition = FeeType.objects.get_or_create(
            school=school, name="Monthly Tuition",
            defaults=dict(fee_category="monthly", frequency="monthly"))[0]
        FeeStructure.objects.get_or_create(
            school=school, fee_type=tuition, academic_year=year,
            applicable_class=c9, defaults=dict(amount=Decimal("1500")))
        Invoice.objects.get_or_create(
            school=school, invoice_number="INV-2026-0001",
            defaults=dict(student=students[0], academic_year=year, month=1,
                          invoice_date=date.today(),
                          line_items=[{"description": "Monthly Tuition",
                                       "amount": 1500, "discount": 0}],
                          subtotal=1500, grand_total=1500, status="sent"))

        # Final exam with a full routine + marks, so merit/transcript/promotion
        # pages have data out of the box.
        exam = ExamSession.objects.get_or_create(
            school=school, name="Annual Exam 2026",
            defaults=dict(academic_year=year, start_date=date(2026, 11, 20),
                          end_date=date(2026, 11, 27), is_final=True))[0]
        papers = [
            (math, date(2026, 11, 20), "Hall-101"),
            (sci, date(2026, 11, 23), "Hall-102"),
            (eng, date(2026, 11, 26), "Hall-101"),
        ]
        exam_subjects = []
        for subj, d, hall in papers:
            es, _ = ExamSubject.objects.get_or_create(
                school=school, exam_session=exam, subject=subj, school_class=c9,
                defaults=dict(exam_date=d, start_time=time(10, 0),
                              end_time=time(13, 0), exam_room=hall,
                              invigilator=teacher, total_marks=100,
                              pass_marks=33))
            exam_subjects.append(es)

        marks = {
            "2026-001": (88, 92, 75),
            "2026-002": (67, 71, 80),
            "2026-003": (95, 89, 91),
            "2026-004": (30, 45, 52),   # fails Mathematics
            "2026-005": (74, 66, 69),
        }
        for s in students:
            for es, m in zip(exam_subjects, marks[s.admission_number]):
                ExamResult.objects.get_or_create(
                    school=school, exam_subject=es, student=s,
                    defaults=dict(marks_obtained=m, entered_by=admin))

        RatingPeriod.objects.get_or_create(
            school=school, name="Term 1 - 2026",
            defaults=dict(start_date=date(2026, 1, 1), end_date=date(2026, 6, 30),
                          is_active=True))
