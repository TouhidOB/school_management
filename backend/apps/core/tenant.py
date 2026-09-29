"""Thread-local current-tenant storage.

TenantMiddleware sets the active school for the duration of a request so the
SchoolScopedManager can auto-filter querysets without every call site having to
pass `school=` explicitly. Outside a request (shell, Celery task) nothing is
set and the scoped manager returns unfiltered rows — callers there must scope
explicitly.
"""
import threading
from contextlib import contextmanager

_state = threading.local()


def set_current_school(school):
    _state.school = school


def get_current_school():
    return getattr(_state, "school", None)


def clear_current_school():
    if hasattr(_state, "school"):
        del _state.school


@contextmanager
def scope_to(school):
    """Temporarily bind a tenant (useful in Celery tasks and management cmds)."""
    previous = get_current_school()
    set_current_school(school)
    try:
        yield
    finally:
        set_current_school(previous)
