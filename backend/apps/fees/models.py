from django.db import models

from apps.core.models import SchoolScopedModel


class FeeType(SchoolScopedModel):
    """Built-in or custom fee category (PRD Requirement 4)."""

    CATEGORY_CHOICES = [
        ("admission", "Admission Fee"),
        ("idcard", "ID Card Fee"),
        ("monthly", "Monthly Tuition Fee"),
        ("exam", "Exam Fee"),
        ("annual", "Annual Fee"),
        ("readmission", "Re-admission Fee"),
        ("library", "Library Fee"),
        ("transport", "Transport Fee"),
        ("hostel", "Hostel Fee"),
        ("custom", "Custom"),
    ]
    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("monthly", "Monthly"),
        ("yearly", "Yearly / Annual"),
        ("seasonal", "Seasonal (Term / Exam Fee)"),
        ("onetime", "One-time"),
        ("termly", "Per Term"),
        ("annual", "Annually"),
        ("eventbased", "Event-based"),
    ]

    name = models.CharField(max_length=100)
    fee_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="custom")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default="monthly")
    is_mandatory = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]
        unique_together = [("school", "name")]

    def __str__(self):
        return self.name


class FeeStructure(SchoolScopedModel):
    """Amount for a fee type, optionally per class or per specific student."""

    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE, related_name="structures")
    academic_year = models.ForeignKey(
        "academics.AcademicYear", on_delete=models.CASCADE, related_name="fee_structures"
    )
    applicable_class = models.ForeignKey(
        "academics.SchoolClass",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="fee_structures",
    )
    applicable_student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="fee_structures",
        help_text="If set, this fee applies specifically to this individual student.",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["-created_at"]


class StudentFeeDiscount(SchoolScopedModel):
    VALUE_FLAT = "flat"
    VALUE_PERCENT = "percent"
    VALUE_CHOICES = [(VALUE_FLAT, "Flat"), (VALUE_PERCENT, "Percent")]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="fee_discounts"
    )
    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE, related_name="discounts")
    discount_type = models.CharField(max_length=50, help_text="Sibling, Merit, Staff Ward, ...")
    discount_value_type = models.CharField(max_length=10, choices=VALUE_CHOICES, default=VALUE_FLAT)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=200, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)


class InvoiceDesign(SchoolScopedModel):
    template_name = models.CharField(max_length=100)
    template_slug = models.SlugField(
        help_text="classic / modern / minimal / official / premium"
    )
    custom_settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.template_name


class Invoice(SchoolScopedModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("partially_paid", "Partially Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="invoices"
    )
    academic_year = models.ForeignKey(
        "academics.AcademicYear", on_delete=models.SET_NULL, null=True, related_name="invoices"
    )
    month = models.PositiveSmallIntegerField(null=True, blank=True)
    invoice_number = models.CharField(max_length=50)
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_fine = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    design_template = models.ForeignKey(
        InvoiceDesign, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices"
    )

    class Meta:
        unique_together = [("school", "invoice_number")]
        ordering = ["-invoice_date"]

    def __str__(self):
        return self.invoice_number


class Payment(SchoolScopedModel):
    METHOD_CHOICES = [
        ("cash", "Cash"),
        ("online", "Online"),
        ("bank", "Bank Transfer"),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES, default="cash")
    transaction_id = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField()
    received_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

class ExpenseCategory(SchoolScopedModel):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = [("school", "name")]

    def __str__(self):
        return self.name

class Expense(SchoolScopedModel):
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name="expenses")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    description = models.TextField(blank=True)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        ordering = ["-expense_date"]

    def __str__(self):
        return f"{self.category.name} - {self.amount}"

class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    fee_type = models.ForeignKey(FeeType, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.description} - {self.amount}"


class SalaryPayment(SchoolScopedModel):
    EMPLOYEE_TYPE_CHOICES = [
        ("teacher", "Teacher"),
        ("staff", "General / Administrative Staff"),
        ("daily_worker", "Daily Wage Staff"),
    ]
    PAYMENT_BASIS_CHOICES = [
        ("monthly", "Monthly"),
        ("yearly", "Yearly / Annual"),
        ("daily", "Daily Wage"),
    ]
    METHOD_CHOICES = [
        ("cash", "Cash"),
        ("bank", "Bank Transfer"),
        ("mobile_money", "Mobile Banking (bKash/Nagad/Rocket)"),
        ("cheque", "Cheque"),
    ]
    STATUS_CHOICES = [
        ("paid", "Paid"),
        ("pending", "Pending"),
    ]

    teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="salary_payments",
    )
    employee_id = models.CharField(max_length=50, blank=True)
    employee_name = models.CharField(max_length=150)
    employee_type = models.CharField(max_length=20, choices=EMPLOYEE_TYPE_CHOICES, default="teacher")
    designation = models.CharField(max_length=100, blank=True)
    payment_basis = models.CharField(max_length=20, choices=PAYMENT_BASIS_CHOICES, default="monthly")

    # Period
    period_month = models.PositiveSmallIntegerField(null=True, blank=True)
    period_year = models.PositiveSmallIntegerField(default=2026)
    period_date = models.DateField(null=True, blank=True)
    period_label = models.CharField(max_length=100, blank=True)

    # Financials
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)  # Net amount paid

    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="cash")
    transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="paid")
    notes = models.TextField(blank=True)
    disbursed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"{self.employee_name} ({self.period_label or self.payment_date}) - {self.amount_paid}"


class SchoolWallet(SchoolScopedModel):
    initial_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = [("school",)]

    def __str__(self):
        return f"Wallet for {self.school.name}"

