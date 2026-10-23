from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("students", v.StudentViewSet)
router.register("guardians", v.GuardianViewSet)
router.register("student-transfers", v.StudentTransferViewSet)
router.register("certificates", v.CertificateViewSet)
router.register("admissions", v.AdmissionApplicationViewSet)
router.register("passing-batches", v.PassingBatchViewSet)
router.register("alumni-profiles", v.AlumniProfileViewSet)

urlpatterns = router.urls
