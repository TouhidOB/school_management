from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("exam-sessions", v.ExamSessionViewSet)
router.register("exam-subjects", v.ExamSubjectViewSet)
router.register("exam-results", v.ExamResultViewSet)
router.register("promotions", v.StudentPromotionViewSet)

urlpatterns = [
    path('annual-results/', v.get_annual_results),
    path('annual-promote/', v.annual_promote),
    path('issue-promotion-fee/', v.issue_promotion_fee),
    path('pay-promotion-fee/', v.pay_promotion_fee),
    path('settle-promotion-fee/', v.settle_promotion_fee),
] + router.urls
