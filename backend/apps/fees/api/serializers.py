"""API serializers.

`school` is never accepted from the client — the viewset stamps it from the
caller's effective school (see base.SchoolScopedViewSet) — so it is read-only
everywhere below.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.academics.models import (
    AcademicYear,
    RoutineSlot,
    SchoolClass,
    Section,
    Subject,
)
from apps.accounts.models import User
from apps.attendance.models import (
    BiometricEnrollment,
    BiometricPunch,
    LeaveApplication,
    StaffAttendance,
    StudentAttendance,
)
from apps.exams.models import (
    ExamResult,
    ExamSession,
    ExamSubject,
    StudentPromotion,
)
from apps.fees.models import (
    FeeStructure,
    FeeType, Expense, ExpenseCategory,
    Invoice,
    InvoiceLineItem,
    Payment,
    StudentFeeDiscount,
    SalaryPayment,
    SchoolWallet,
)
from apps.notifications.models import Notification
from apps.ratings.models import RatingPeriod, TeacherRating, TeacherRatingAggregate
from apps.rooms.models import (
    Assignment,
    AssignmentSubmission,
    ClassRoom,
    Note,
    RoomMembership,
    RoomPost,
)
from apps.students.models import (
    AdmissionApplication,
    Certificate,
    Guardian,
    Student,
    StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = "__all__"
        read_only_fields = ["school"]


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_type_name = serializers.CharField(source="fee_type.name", read_only=True)
    fee_frequency = serializers.CharField(source="fee_type.frequency", read_only=True)
    class_name = serializers.CharField(source="applicable_class.name", read_only=True, default=None)
    student_name = serializers.CharField(source="applicable_student.full_name", read_only=True, default=None)
    student_roll = serializers.CharField(source="applicable_student.roll_number", read_only=True, default=None)
    student_id = serializers.CharField(source="applicable_student.admission_number", read_only=True, default=None)

    class Meta:
        model = FeeStructure
        fields = [
            "id", "fee_type", "fee_type_name", "fee_frequency", "academic_year",
            "applicable_class", "class_name", "applicable_student", "student_name", "student_roll", "student_id",
            "amount",
        ]
        read_only_fields = ["school"]


class StudentFeeDiscountSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_roll = serializers.CharField(source="student.roll_number", read_only=True)
    student_admission = serializers.CharField(source="student.admission_number", read_only=True)
    class_id = serializers.IntegerField(source="student.current_class_id", read_only=True)
    class_name = serializers.CharField(source="student.current_class.name", default="", read_only=True)
    section_id = serializers.IntegerField(source="student.current_section_id", read_only=True)
    section_name = serializers.CharField(source="student.current_section.name", default="", read_only=True)
    fee_type_name = serializers.CharField(source="fee_type.name", read_only=True)

    class Meta:
        model = StudentFeeDiscount
        fields = "__all__"
        read_only_fields = ["school"]


class PaymentSerializer(serializers.ModelSerializer):
    method_display = serializers.CharField(source="get_payment_method_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "invoice", "amount_paid", "payment_method", "method_display",
            "transaction_id", "paid_at", "received_by",
        ]
        read_only_fields = ["received_by"]


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ["id", "fee_type", "description", "amount", "discount"]


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_roll = serializers.CharField(source="student.roll_number", read_only=True, default="")
    student_class = serializers.CharField(source="student.current_class.name", read_only=True, default="")
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    line_items = InvoiceLineItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            "id", "student", "student_name", "student_roll", "student_class", "academic_year", "month",
            "invoice_number", "invoice_date", "due_date", "line_items",
            "subtotal", "total_discount", "late_fine", "grand_total",
            "status", "status_display", "payments",
        ]

    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        invoice = super().create(validated_data)
        for item_data in line_items_data:
            InvoiceLineItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        invoice = super().update(instance, validated_data)
        
        if line_items_data is not None:
            instance.line_items.all().delete()
            for item_data in line_items_data:
                InvoiceLineItem.objects.create(invoice=invoice, **item_data)
                
        return invoice

class ExpenseCategorySerializer(serializers.ModelSerializer):
    total_spent = serializers.SerializerMethodField()
    expense_count = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "description", "total_spent", "expense_count"]
        read_only_fields = ["school"]

    def get_total_spent(self, obj):
        from django.db.models import Sum
        return float(obj.expenses.aggregate(t=Sum("amount"))["t"] or 0)

    def get_expense_count(self, obj):
        return obj.expenses.count()

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = Expense
        fields = ["id", "category", "category_name", "amount", "expense_date", "description", "recorded_by", "recorded_by_name"]
        read_only_fields = ["school", "recorded_by"]


class SalaryPaymentSerializer(serializers.ModelSerializer):
    employee_type_display = serializers.CharField(source="get_employee_type_display", read_only=True)
    payment_basis_display = serializers.CharField(source="get_payment_basis_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    disbursed_by_name = serializers.CharField(source="disbursed_by.get_full_name", read_only=True, default=None)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)

    class Meta:
        model = SalaryPayment
        fields = "__all__"
        read_only_fields = ["school", "disbursed_by"]


class SchoolWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolWallet
        fields = ["id", "initial_balance", "notes"]
        read_only_fields = ["school"]

