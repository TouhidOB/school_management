"""Common types for biometric device adapters.

Every brand posts scan data in its own shape. An adapter's only job is to turn
an incoming HTTP request into a list of normalized `Punch` objects; the ingest
pipeline (apps.attendance.ingest) handles resolution and attendance writing.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime

from django.utils import timezone


@dataclass
class Punch:
    device_user_id: str
    timestamp: datetime
    direction: str = "in"          # "in" | "out" | "unknown"
    raw: dict = field(default_factory=dict)


def parse_dt(value) -> datetime:
    """Best-effort parse of a device timestamp into an aware datetime."""
    if isinstance(value, datetime):
        dt = value
    else:
        s = str(value).strip().replace("T", " ")
        dt = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
                    "%d-%m-%Y %H:%M:%S", "%Y/%m/%d %H:%M:%S"):
            try:
                dt = datetime.strptime(s, fmt)
                break
            except ValueError:
                continue
        if dt is None:
            dt = datetime.fromisoformat(s)  # last resort; may raise
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


class BaseAdapter:
    """Subclass per brand. Implement `parse(request) -> list[Punch]`."""

    brand = "base"

    def parse(self, request) -> list[Punch]:  # pragma: no cover - interface
        raise NotImplementedError

    # helpers -------------------------------------------------------------
    @staticmethod
    def _json(request):
        if request.body:
            try:
                return json.loads(request.body.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return {}
        return {}
