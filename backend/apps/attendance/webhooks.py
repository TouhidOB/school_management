"""Public ingest endpoint for biometric devices.

    POST /api/devices/punch/
    Auth: header `X-Device-Token: <school.device_token>` (or ?token=)
    Body: whatever the school's device brand sends (parsed by its adapter).

No session/CSRF — devices authenticate purely with the per-school token, so
keep that token secret and serve this over HTTPS in production.
"""
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from apps.attendance.devices import get_adapter
from apps.attendance.ingest import ingest_punches
from apps.core.tenant import scope_to
from apps.tenants.models import School


@csrf_exempt
def device_punch(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    token = request.headers.get("X-Device-Token") or request.GET.get("token", "")
    token = token.strip()
    if not token:
        return JsonResponse({"error": "missing device token"}, status=401)

    school = School.all_objects.filter(device_token=token).first()
    if school is None:
        return JsonResponse({"error": "invalid device token"}, status=401)
    if school.device_brand == School.DEVICE_NONE:
        return JsonResponse({"error": "no device brand configured"}, status=400)

    adapter = get_adapter(school.device_brand)
    if adapter is None:
        return JsonResponse({"error": "unsupported device brand"}, status=400)

    try:
        punches = adapter.parse(request)
    except Exception as exc:  # malformed payload
        return JsonResponse({"error": f"could not parse payload: {exc}"}, status=400)

    with scope_to(school):
        result = ingest_punches(school, punches)
    return JsonResponse({"ok": True, "brand": school.device_brand, **result})
