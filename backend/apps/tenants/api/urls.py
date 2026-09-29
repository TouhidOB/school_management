from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as v

router = DefaultRouter()
router.register("schools", v.AdminSchoolViewSet)
router.register("leads", v.AdminLeadViewSet)
router.register("plans", v.AdminPlanViewSet)

urlpatterns = [
    path("platform/stats/", v.PlatformStatsView.as_view(), name="api_platform_stats"),
    path("platform/search/", v.GlobalSearchView.as_view(), name="api_platform_search"),
    path("platform/", include(router.urls)),
    path("public/schools/", v.PublicSchoolListView.as_view()),
    path("public/schools/<slug:slug>/", v.PublicSchoolDetailView.as_view()),
    path("public/schools/<slug:slug>/apply/", v.PublicAdmissionApplyView.as_view()),
    path("public/plans/", v.PublicPlanListView.as_view(), name="public_plans"),
    path("public/contact/", v.PublicContactLeadCreateView.as_view(), name="public_contact"),
]
