"""Tenant-scoped ORM manager.

Critical isolation rule (PRD Section 7): never leak rows across tenants.
`SchoolScopedManager.get_queryset()` auto-filters by the thread-local current
school when one is set. Use `.unscoped()` deliberately (Super Admin, cross-tenant
reporting) to opt out.
"""
from django.db import models

from .tenant import get_current_school


class SchoolScopedQuerySet(models.QuerySet):
    def for_school(self, school):
        return self.filter(school=school)


class SchoolScopedManager(models.Manager.from_queryset(SchoolScopedQuerySet)):
    def get_queryset(self):
        qs = super().get_queryset()
        school = get_current_school()
        if school is not None:
            return qs.filter(school=school)
        return qs

    def unscoped(self):
        """Bypass tenant filtering. For Super Admin / platform-level code only."""
        return super().get_queryset()
