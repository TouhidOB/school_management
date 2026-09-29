from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from apps.attendance.webhooks import device_punch


def health(_request):
    """Liveness probe for docker / nginx upstream checks."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz/", health, name="health"),
    # Biometric device webhook (token-authenticated, not part of the SPA API).
    path("api/devices/punch/", device_punch, name="device_punch"),
    # Decoupled JSON API consumed by the Next.js frontend.
    path("api/", include("apps.accounts.api.urls")),
    path("api/", include("apps.tenants.api.urls")),
    path("api/", include("apps.subscriptions.api.urls")),
    path("api/", include("apps.support.api.urls")),
    path("api/", include("apps.cms.api.urls")),
    path("api/", include("apps.academics.api.urls")),
    path("api/", include("apps.teachers.api.urls")),
    path("api/", include("apps.students.api.urls")),
    path("api/library/", include("apps.library.api.urls")),
    path("api/transport/", include("apps.transport.api.urls")),
    path("api/hostel/", include("apps.hostel.api.urls")),
    path("api/inventory/", include("apps.inventory.api.urls")),
    path("api/", include("apps.fees.api.urls")),
    path("api/", include("apps.exams.api.urls")),
    path("api/", include("apps.attendance.api.urls")),
    path("api/", include("apps.rooms.api.urls")),
    path("api/", include("apps.ratings.api.urls")),
    path("api/", include("apps.notifications.api.urls")),
    path("api/core/", include("apps.core.api.urls")),
]

# Media (student photos, certificates, admission PDFs). In production nginx
# serves /media/ directly from the shared volume; this fallback covers local
# `runserver` and shared-hosting deploys.
if settings.DEBUG or getattr(settings, "SERVE_MEDIA", False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
