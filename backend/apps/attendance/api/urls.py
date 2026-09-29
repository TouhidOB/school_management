from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("student-attendance", v.StudentAttendanceViewSet)
router.register("staff-attendance", v.StaffAttendanceViewSet)
router.register("leaves", v.LeaveApplicationViewSet)
router.register("staff-leaves", v.StaffLeaveApplicationViewSet)
router.register("biometric-enrollments", v.BiometricEnrollmentViewSet)
router.register("biometric-punches", v.BiometricPunchViewSet)

urlpatterns = router.urls
