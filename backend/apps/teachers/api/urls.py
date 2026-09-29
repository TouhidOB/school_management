from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("designations", v.DesignationViewSet)
router.register("departments", v.DepartmentViewSet)
router.register("teachers", v.TeacherProfileViewSet)

urlpatterns = router.urls
