"""Shared view mixins: role gating + tenant-scoped CRUD scaffolding."""
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.urls import reverse_lazy

ADMIN_ROLES = {"school_admin"}


class RoleRequiredMixin(LoginRequiredMixin):
    """Allow only users whose role is in `allowed_roles`."""

    allowed_roles: set[str] = set()

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        # Super Admin can access every school-scoped page (platform-wide access).
        if request.user.role == "super_admin":
            return super().dispatch(request, *args, **kwargs)
        if self.allowed_roles and request.user.role not in self.allowed_roles:
            raise PermissionDenied("Your role cannot access this page.")
        return super().dispatch(request, *args, **kwargs)


class SchoolAdminMixin(RoleRequiredMixin):
    allowed_roles = ADMIN_ROLES


class TenantQuerysetMixin:
    """Filter list/detail querysets to the current tenant.

    The scoped manager already filters by the request tenant via middleware,
    but we belt-and-braces it here so a missing thread-local never leaks rows.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        school = getattr(self.request, "school", None) or getattr(
            self.request.user, "school", None)
        if school is not None:
            return qs.filter(school=school)
        return qs.none()


def current_school(request):
    """Resolve the active tenant, tolerating a missing thread-local."""
    return getattr(request, "school", None) or getattr(request.user, "school", None)


class TenantFormMixin:
    """Stamp the tenant onto new objects and scope FK dropdowns to it."""

    success_message = "Saved."

    def form_valid(self, form):
        school = current_school(self.request)
        if hasattr(form.instance, "school_id"):
            if school is None:
                messages.error(
                    self.request,
                    "Your account isn't linked to a school, so this couldn't be "
                    "saved. Log in as a school admin or attach your account to a "
                    "school.",
                )
                return self.form_invalid(form)
            if not form.instance.pk:
                form.instance.school = school
        response = super().form_valid(form)
        messages.success(self.request, self.success_message)
        return response
