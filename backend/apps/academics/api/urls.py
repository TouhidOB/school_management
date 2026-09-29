from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("academic-years", v.AcademicYearViewSet)
router.register("classes", v.SchoolClassViewSet)
router.register("subjects", v.SubjectViewSet)
router.register("sections", v.SectionViewSet)
router.register("routine-slots", v.RoutineSlotViewSet)
router.register("events", v.EventViewSet)

urlpatterns = router.urls
