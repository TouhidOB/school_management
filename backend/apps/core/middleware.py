"""Resolve the tenant from the request subdomain.

`greenvalley.platform.local` -> School(slug="greenvalley").
Sets `request.school` and the thread-local used by SchoolScopedManager.
Custom domains (Premium) are matched against School.custom_domain first.

The bare platform domain and `www`/`app`/`admin` hosts carry no tenant
(landing pages, Super Admin panel) and leave `request.school = None`.
"""
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

from .tenant import clear_current_school, set_current_school

RESERVED_SUBDOMAINS = {"www", "app", "admin", "api", "static", "media"}


class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Import here to avoid AppRegistryNotReady at import time.
        from apps.tenants.models import School

        request.school = None
        clear_current_school()

        host = request.get_host().split(":")[0].lower()
        base = settings.PLATFORM_DOMAIN.lower()
        school = None

        if host.endswith("." + base):
            sub = host[: -(len(base) + 1)]
            # Only the left-most label is the tenant slug.
            sub = sub.split(".")[0]
            if sub and sub not in RESERVED_SUBDOMAINS:
                school = School.all_objects.filter(slug=sub).first()
        elif host not in (base,):
            # Possible Premium custom domain.
            school = School.all_objects.filter(custom_domain=host).first()

        # Tenant binding for authenticated users. A regular employee is ALWAYS
        # pinned to their own school — the subdomain never overrides this, so a
        # School-A user can never reach School-B data even via B's URL/subdomain
        # (defense in depth against shared-cookie / spoofed-host access).
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            role = getattr(user, "role", None)
            if role != "super_admin" and getattr(user, "school_id", None):
                school = user.school
            elif role == "super_admin":
                # Super Admin has no home school. They "enter" a tenant to manage
                # it; that choice is stored in the session. No selection => they
                # stay on the platform (unscoped) views. Subdomain is ignored.
                sid = request.session.get("active_school_id")
                school = School.all_objects.filter(pk=sid).first() if sid else None
            elif user.is_superuser and school is None:
                # A `createsuperuser` account (not the super_admin role) carries no
                # school. Scope it to the first tenant so it can operate in dev.
                school = School.all_objects.order_by("id").first()

        if school is not None:
            request.school = school
            set_current_school(school)

        # A school awaiting Super Admin approval is locked out of the app —
        # its admin only ever sees the "pending approval" dashboard.
        if (school is not None and user is not None and user.is_authenticated
                and getattr(user, "role", None) != "super_admin"
                and school.status == school.STATUS_PENDING
                and request.path.startswith("/app/")
                and request.path != "/app/"):
            from django.shortcuts import redirect
            return redirect("dashboard")

    def process_response(self, request, response):
        clear_current_school()
        return response
