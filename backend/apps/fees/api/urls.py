from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("fee-types", v.FeeTypeViewSet)
router.register("fee-structures", v.FeeStructureViewSet)
router.register("fee-discounts", v.StudentFeeDiscountViewSet)
router.register("invoices", v.InvoiceViewSet)
router.register("payments", v.PaymentViewSet)
router.register("expense-categories", v.ExpenseCategoryViewSet)
router.register("expenses", v.ExpenseViewSet)
router.register("salary-payments", v.SalaryPaymentViewSet)
router.register("student-dues", v.StudentDuesViewSet, basename="student-dues")
router.register("school-wallet", v.SchoolWalletViewSet, basename="school-wallet")

urlpatterns = router.urls

