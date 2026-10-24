"""Shared DRF building blocks for the tenant-scoped API.

Tenant resolution for the decoupled SPA
----------------------------------------
JWT auth runs inside DRF (after Django middleware), so the old subdomain
`TenantMiddleware` can't see the JWT user. Tenant is resolved here instead, from
the *effective school*:

* Normal user (school_admin, teacher, …) -> ALWAYS their own `user.school`.
  A header can never move them to another tenant (hard isolation).
* Super Admin (role=super_admin, no home school) -> the school named in the
  `X-Active-School` request header (falling back to a session value). This is
  how the platform owner "enters" any school with no extra password: their own
  JWT already proves who they are; the header just picks which tenant to act in.

`get_active_school()` centralises that rule. `SchoolScopedViewSet` binds the
result to the thread-local (so `SchoolScopedManager` + related-PK fields
auto-filter) and re-filters querysets explicitly as defense in depth.
"""
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.core.tenant import clear_current_school, set_current_school

# request.META key for the "act as this school" header (X-Active-School: <id>).
ACTIVE_SCHOOL_META = "HTTP_X_ACTIVE_SCHOOL"


def get_active_school(request):
    """The tenant this request operates in, or None.

    Super Admin: header/session-selected school (no password needed).
    Everyone else: pinned to their own school regardless of any header.
    """
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None

    if getattr(user, "is_super_admin", False):
        sid = request.META.get(ACTIVE_SCHOOL_META)
        if not sid:
            session = getattr(request, "session", None)
            sid = session.get("active_school_id") if session else None
        if not sid:
            return None
        from apps.tenants.models import School
        return School.all_objects.filter(pk=sid).first()

    return getattr(user, "school", None)


class SchoolScopedViewSet(viewsets.ModelViewSet):
    """ModelViewSet pinned to the caller's effective school.

    Subclasses just set `queryset` + `serializer_class`; this base handles
    tenant binding, filtering, module availability enforcement, and stamping `school` on create.
    """
    required_module = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self._active_school = get_active_school(request)
        if self._active_school is not None:
            # Bind thread-local so nested manager queries (serializer choice
            # fields, related PK lookups) are tenant-filtered too.
            set_current_school(self._active_school)

            # Enforce module availability for the active school
            if self.required_module:
                modules = self._active_school.get_modules()
                if not modules.get(self.required_module, True):
                    bypass = getattr(request.user, "is_super_admin", False) and request.META.get("HTTP_X_BYPASS_MODULE_CHECK") == "1"
                    if not bypass:
                        raise PermissionDenied({
                            "detail": f"The '{self.required_module}' module is currently disabled for this institution.",
                            "module": self.required_module,
                            "code": "module_disabled"
                        })

    def finalize_response(self, request, response, *args, **kwargs):
        clear_current_school()
        return super().finalize_response(request, response, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        school = getattr(self, "_active_school", None)
        if school is None:
            # Super Admin who hasn't entered a school yet, or a user with no
            # school -> no tenant rows (they must select a school first).
            return qs.none()
        return qs.filter(school=school)

    def perform_create(self, serializer):
        school = getattr(self, "_active_school", None)
        if school is None:
            raise PermissionDenied(
                "No active school. Super Admin: select a school (X-Active-School "
                "header) before creating records."
            )
        serializer.save(school=school)

from rest_framework.pagination import PageNumberPagination
class DynamicPageNumberPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 1000
