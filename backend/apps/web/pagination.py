"""Small helper for paginating function-based list views.

CRUD lists use ListView's built-in pagination; this covers the hand-written
views (invoices, schools, notifications, student portal) with the same UX.
"""
from django.core.paginator import Paginator


def paginate(request, queryset, per_page=25):
    """Return the requested Page for `queryset` (?page=N, clamped safely)."""
    return Paginator(queryset, per_page).get_page(request.GET.get("page"))
