from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as v

router = DefaultRouter()
router.register("plans", v.SubscriptionPlanViewSet, basename="plans")
router.register("subscriptions", v.SubscriptionViewSet, basename="subscriptions")
router.register("gateways", v.PaymentGatewayViewSet, basename="gateways")
router.register("invoices", v.InvoiceViewSet, basename="invoices")
router.register("transactions", v.TransactionViewSet, basename="transactions")
router.register("refunds", v.RefundViewSet, basename="refunds")
router.register("coupons", v.CouponViewSet, basename="coupons")

urlpatterns = [
    path("platform/billing/", include(router.urls)),
]
