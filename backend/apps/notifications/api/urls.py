from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("notifications", v.NotificationViewSet)
router.register("platform/communication/announcements", v.AnnouncementViewSet, basename="platform_announcements")
router.register("platform/communication/templates", v.MessageTemplateViewSet, basename="platform_templates")
router.register("platform/communication/logs", v.PlatformNotificationViewSet, basename="platform_notification_logs")

urlpatterns = router.urls
