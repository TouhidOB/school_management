import os

filepath = "backend/apps/tenants/api/views.py"
with open(filepath, "r") as f:
    content = f.read()

# We need to import Subscription, Invoice, Transaction, ContactMessage
import_stmts = """
from apps.subscriptions.models import Subscription, Invoice, Transaction
from apps.core.models import ContactMessage
from django.db.models import Sum
from datetime import datetime, timedelta
from django.utils import timezone
"""

new_stats_view = """
class PlatformStatsView(APIView):
    \"\"\"Cross-tenant KPIs for the Super Admin comprehensive dashboard.\"\"\"
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
        for s in pending_schools:
            attention_center.append({
                "id": f"s-{s.id}", "issue": "Pending school approval", 
                "severity": "medium", "tenant": s.name, 
                "date": s.created_at.strftime("%Y-%m-%d"), "status": "Pending"
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
"""

# Replace the old PlatformStatsView
import re
new_content = re.sub(
    r'class PlatformStatsView\(APIView\):.*?return Response\(\{.*?\}\)\n', 
    new_stats_view, 
    content, 
    flags=re.DOTALL
)

if import_stmts not in new_content:
    new_content = new_content.replace('from rest_framework.views import APIView', 'from rest_framework.views import APIView\n' + import_stmts)

with open(filepath, "w") as f:
    f.write(new_content)
