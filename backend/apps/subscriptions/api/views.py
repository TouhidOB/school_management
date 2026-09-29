from rest_framework import viewsets
from apps.core.permissions import IsSuperAdmin
from apps.subscriptions.models import Subscription, PaymentGateway, Invoice, Transaction, Refund, Coupon
from apps.tenants.models import SubscriptionPlan
from . import serializers as s

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = SubscriptionPlan.objects.all().order_by("price_monthly")
    serializer_class = s.SubscriptionPlanSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Subscription.objects.all().order_by("-created_at")
    serializer_class = s.SubscriptionSerializer
    filterset_fields = ["status", "school"]
    search_fields = ["school__name", "plan__name"]

class PaymentGatewayViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = PaymentGateway.objects.all()
    serializer_class = s.PaymentGatewaySerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Invoice.objects.all().order_by("-issue_date")
    serializer_class = s.InvoiceSerializer
    filterset_fields = ["status", "school"]

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Transaction.objects.all().order_by("-payment_date")
    serializer_class = s.TransactionSerializer
    filterset_fields = ["status", "school"]

class RefundViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Refund.objects.all().order_by("-refund_date")
    serializer_class = s.RefundSerializer

class CouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Coupon.objects.all().order_by("-start_date")
    serializer_class = s.CouponSerializer
