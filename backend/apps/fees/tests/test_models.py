import pytest
from datetime import date
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from apps.tenants.models import School
from apps.academics.models import AcademicYear, SchoolClass
from apps.students.models import Student
from apps.fees.models import FeeType, FeeStructure, Invoice, Payment

@pytest.fixture
def school():
    return School.objects.create(name="Fees School", slug="fees-school")

@pytest.fixture
def year(school):
    return AcademicYear.objects.create(school=school, name="2026")

@pytest.fixture
def student(school):
    return Student.objects.create(school=school, admission_number="F001", full_name="Fee Student")

@pytest.mark.django_db
class TestFeesModels:
    def test_fee_type_creation(self, school):
        fee = FeeType.objects.create(school=school, name="Tuition Fee", fee_category="monthly", frequency="monthly")
        assert fee.name == "Tuition Fee"
        assert fee.is_mandatory is True

    def test_fee_structure(self, school, year):
        fee = FeeType.objects.create(school=school, name="Library Fee")
        struct = FeeStructure.objects.create(school=school, fee_type=fee, academic_year=year, amount=Decimal("150.00"))
        assert struct.amount == Decimal("150.00")

    def test_invoice_creation(self, school, year, student):
        inv = Invoice.objects.create(
            school=school, student=student, academic_year=year, invoice_number="INV-001",
            invoice_date=date.today(), grand_total=Decimal("1500.00"), status="draft"
        )
        assert inv.status == "draft"

    def test_payment(self, school, year, student):
        inv = Invoice.objects.create(
            school=school, student=student, academic_year=year, invoice_number="INV-002",
            invoice_date=date.today(), grand_total=Decimal("1500.00")
        )
        payment = Payment.objects.create(
            school=school, invoice=inv, amount_paid=Decimal("1000.00"), 
            payment_method="online", paid_at=timezone.now()
        )
        assert payment.amount_paid == Decimal("1000.00")
