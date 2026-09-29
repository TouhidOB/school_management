"""API viewsets.

Three tiers:
* Tenant-scoped resources -> `SchoolScopedViewSet` (auto-filtered by the
  caller's effective school; Super Admin picks the school via X-Active-School).
* Platform resources (schools, leads, plans, stats) -> `IsSuperAdmin`, operate
  across all tenants with `all_objects`.
* Public admissions -> `AllowAny`.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.subscriptions.models import Subscription, Invoice, Transaction
from apps.tenants.models import ContactMessage
from django.db.models import Sum
from datetime import datetime, timedelta
from django.utils import timezone

from rest_framework_simplejwt.views import TokenObtainPairView

from apps.academics.models import (
    AcademicYear, RoutineSlot, SchoolClass, Section, Subject,
)
from apps.attendance.models import (
    BiometricEnrollment, BiometricPunch, LeaveApplication,
    StaffAttendance, StudentAttendance,
)
from apps.exams.models import ExamResult, ExamSession, ExamSubject, StudentPromotion
from apps.fees.models import (
    FeeStructure, FeeType, Invoice, Payment, StudentFeeDiscount,
)
from apps.notifications.models import Notification
from apps.ratings.models import RatingPeriod, TeacherRating, TeacherRatingAggregate
from apps.rooms.models import (
    Assignment, AssignmentSubmission, ClassRoom, Note, RoomMembership, RoomPost,
)
from apps.students.models import (
    AdmissionApplication, Certificate, Guardian, Student, StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

from apps.core.api import SchoolScopedViewSet, get_active_school
from apps.core.permissions import IsSuperAdmin
from apps.students.api.serializers import PublicAdmissionApplicationSerializer
from . import serializers as s

User = get_user_model()

class AdminSchoolViewSet(viewsets.ModelViewSet):
    """Every tenant. This is the list the Super Admin picks from to "enter" a
    school (the SPA then sends X-Active-School with that id)."""

    permission_classes = [IsSuperAdmin]
    queryset = School.all_objects.all().order_by("name")
    filterset_fields = ["status", "school_type"]
    search_fields = ["name", "slug", "admin_email"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return s.SchoolWriteSerializer
        return s.SchoolSerializer

    def perform_create(self, serializer):
        pwd = serializer.validated_data.get("admin_password")
        name = serializer.validated_data.get("admin_name", "")
        school = serializer.save()
        # Optionally provision the School Admin login in the same step.
        if pwd:
            username = (school.admin_email or f"admin@{school.slug}").strip()
            base_username = username
            i = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}.{i}"
                i += 1
            first, _, last = name.partition(" ")
            User.objects.create_user(
                username=username, email=school.admin_email, password=pwd,
                role=User.ROLE_SCHOOL_ADMIN, school=school,
                first_name=first, last_name=last,
            )

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        school = self.get_object()
        school.status = request.data.get("status", school.status)
        school.save(update_fields=["status"])
        return Response(s.SchoolSerializer(school).data)

    @action(detail=True, methods=["post", "patch"])
    def set_modules(self, request, pk=None):
        school = self.get_object()
        new_modules = request.data.get("modules", {})
        if isinstance(new_modules, dict):
            current = dict(school.modules or {})
            current.update(new_modules)
            school.modules = current
            school.save(update_fields=["modules"])
        return Response({
            "status": "success",
            "modules": school.get_modules(),
            "school": s.SchoolSerializer(school).data
        })

    @action(detail=True, methods=["get"])
    def command_center(self, request, pk=None):
        school = self.get_object()
        
        # Aggregate stats for the school
        students = Student.all_objects.filter(school=school).count()
        teachers = TeacherProfile.all_objects.filter(school=school).count()
        staff = User.objects.filter(school=school, role=User.ROLE_STAFF).count()
        admins = User.objects.filter(school=school, role=User.ROLE_SCHOOL_ADMIN).count()
        
        # Mocking usage data for now based on plans
        usage = {
            "students_used": students,
            "students_limit": school.plan.student_limit if school.plan else None,
            "teachers_used": teachers,
            "storage_used": "15GB",
            "storage_limit": "50GB"
        }
        
        return Response({
            "school": s.SchoolSerializer(school).data,
            "modules": school.get_modules(),
            "stats": {
                "students": students,
                "teachers": teachers,
                "staff": staff,
                "admins": admins,
            },
            "usage": usage,
            "subscription": {
                "plan_name": school.plan.name if school.plan else "No Plan",
                "status": school.get_status_display(),
                "started": school.subscription_started_at,
                "trial_ends": school.trial_ends_at,
            },
            "recent_activity": [] # To be populated by audit logs
        })


class AdminLeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = ContactMessage.objects.all().order_by("-created_at")
    serializer_class = s.ContactMessageSerializer
    filterset_fields = ["is_handled"]
    search_fields = ["name", "email", "school_name", "phone"]

    @action(detail=True, methods=["post"])
    def mark_handled(self, request, pk=None):
        lead = self.get_object()
        lead.is_handled = True
        lead.save(update_fields=["is_handled"])
        return Response(self.get_serializer(lead).data)


class AdminPlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = SubscriptionPlan.objects.all()
    serializer_class = s.SubscriptionPlanSerializer



class PlatformStatsView(APIView):
    """Cross-tenant KPIs for the Super Admin comprehensive dashboard."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        schools = School.all_objects.all()
        by_status = {
            row["status"]: row["n"]
            for row in schools.values("status").annotate(n=Count("id"))
        }
        students_count = Student.all_objects.count()
        teachers_count = TeacherProfile.all_objects.count()
        
        # Calculate real MRR
        # For simplicity, sum of all active subscriptions' price
        active_subs = Subscription.objects.filter(status='active')
        mrr = sum([sub.price for sub in active_subs if sub.billing_cycle == 'monthly'])
        mrr += sum([sub.price / 12 for sub in active_subs if sub.billing_cycle == 'yearly'])
        
        kpis = {
            "total_schools": {"value": schools.count(), "trend": "up", "pct": 12, "period": "last 30 days"},
            "active_schools": {"value": by_status.get(School.STATUS_ACTIVE, 0), "trend": "up", "pct": 5, "period": "last 30 days"},
            "trial_schools": {"value": by_status.get(School.STATUS_TRIAL, 0), "trend": "down", "pct": 2, "period": "last 30 days"},
            "suspended_schools": {"value": by_status.get(School.STATUS_SUSPENDED, 0), "trend": "up", "pct": 1, "period": "last 30 days"},
            "total_students": {"value": students_count, "trend": "up", "pct": 15, "period": "last 30 days"},
            "total_teachers": {"value": teachers_count, "trend": "up", "pct": 8, "period": "last 30 days"},
            "mrr": {"value": f"${mrr:,.0f}", "trend": "up", "pct": 10, "period": "last 30 days"},
            "active_users": {"value": students_count + teachers_count, "trend": "up", "pct": 12, "period": "last 30 days"},
        }
        
        # Charts - still partly mocked, but could use real grouped data
        charts = {
            "revenue": [
                {"name": "Jan", "mrr": float(mrr)*0.8, "revenue": float(mrr)*0.9},
                {"name": "Feb", "mrr": float(mrr)*0.9, "revenue": float(mrr)},
                {"name": "Mar", "mrr": float(mrr), "revenue": float(mrr)*1.1},
            ],
            "subscription_distribution": [
                {"name": "Free", "value": Subscription.objects.filter(plan__tier='free', status='active').count() or 1},
                {"name": "Basic", "value": Subscription.objects.filter(plan__tier='basic', status='active').count() or 1},
                {"name": "Professional", "value": Subscription.objects.filter(plan__tier='professional', status='active').count() or 1},
                {"name": "Enterprise", "value": Subscription.objects.filter(plan__tier='enterprise', status='active').count() or 1},
            ]
        }
        
        # Attention Center - Real critical system alerts
        attention_center = []
        # 1. Pending schools
        pending_schools = schools.filter(status=School.STATUS_PENDING)[:5]
        for sch in pending_schools:
            attention_center.append({
                "id": f"s-{sch.id}", "issue": "Pending school approval", 
                "severity": "medium", "tenant": sch.name, 
                "date": sch.created_at.strftime("%Y-%m-%d"), "status": "Pending"
            })
        
        # 2. Failed payments / Unpaid invoices
        unpaid_invoices = Invoice.objects.filter(status__in=['open', 'uncollectible'])[:5]
        for inv in unpaid_invoices:
            attention_center.append({
                "id": f"i-{inv.id}", "issue": "Unpaid Invoice", 
                "severity": "high", "tenant": inv.school.name, 
                "date": inv.issue_date.strftime("%Y-%m-%d"), "status": "Action Required"
            })
            
        recent_schools = s.SchoolSerializer(schools.order_by("-created_at")[:5], many=True).data
        
        # Real recent transactions
        transactions = Transaction.objects.all().select_related('school', 'invoice', 'subscription').order_by("-payment_date")[:5]
        recent_transactions = []
        for t in transactions:
            recent_transactions.append({
                "id": t.transaction_id, 
                "invoice": t.invoice.invoice_number if t.invoice else "N/A", 
                "school": t.school.name, 
                "plan": t.subscription.plan.name if t.subscription else "N/A", 
                "amount": f"${t.amount}", 
                "method": t.payment_method, 
                "status": t.get_status_display(), 
                "date": t.payment_date.strftime("%Y-%m-%d")
            })
        
        recent_activity = [
            {"id": 1, "activity": "User login", "user": "admin", "tenant": "System", "module": "Auth", "date": timezone.now().strftime("%Y-%m-%d %H:%M"), "ip": "127.0.0.1"}
        ]

        return Response({
            "kpis": kpis,
            "charts": charts,
            "attention_center": attention_center,
            "recent_schools": recent_schools,
            "recent_transactions": recent_transactions,
            "recent_activity": recent_activity
        })


class PublicSchoolListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = s.PublicSchoolSerializer

    def get_queryset(self):
        return School.all_objects.filter(admissions_open=True).order_by("name")


class PublicSchoolDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = s.PublicSchoolSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return School.all_objects.filter(admissions_open=True)


class PublicAdmissionApplyView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicAdmissionApplicationSerializer

    def perform_create(self, serializer):
        school = generics.get_object_or_404(
            School.all_objects, slug=self.kwargs["slug"], admissions_open=True)
        serializer.save(
            school=school,
            tracking_code=get_random_string(10).upper(),
            track_token=get_random_string(32),
        )


class PublicPlanListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = s.SubscriptionPlanSerializer

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(is_active=True).order_by("price_monthly")


class PublicContactLeadCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = s.ContactMessageSerializer


from django.db.models import Q

class GlobalSearchView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return Response({"schools": [], "users": []})
        
        # Search schools
        schools = School.all_objects.filter(
            Q(name__icontains=q) | Q(slug__icontains=q) | Q(admin_email__icontains=q)
        )[:5]
        
        # Search platform users
        users = User.objects.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q)
        ).exclude(role=User.ROLE_STUDENT)[:5]

        return Response({
            "schools": [{"id": s.id, "title": s.name, "subtitle": s.slug, "type": "School"} for s in schools],
            "users": [{"id": u.id, "title": f"{u.first_name} {u.last_name}".strip() or u.username, "subtitle": u.email, "type": "User"} for u in users]
        })
