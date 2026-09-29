from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views as v

router = DefaultRouter()
router.register("users", v.UserViewSet, basename="users")
router.register("platform/users", v.PlatformUserViewSet, basename="platform_users")
router.register("platform/school-admins", v.SchoolAdminViewSet, basename="platform_school_admins")
router.register("platform/security/logs", v.LoginActivityViewSet, basename="platform_security_logs")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/login/", v.LoginView.as_view(), name="api_login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="api_refresh"),
    path("auth/me/", v.MeView.as_view(), name="api_me"),
    path("school/", v.SchoolProfileView.as_view(), name="api_school"),
    path("device-settings/", v.DeviceSettingsView.as_view(), name="api_device_settings"),
]
