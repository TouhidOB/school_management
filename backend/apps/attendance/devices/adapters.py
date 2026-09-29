"""Per-brand biometric device adapters.

Each adapter documents the payload shape it expects. Real deployments usually
run a tiny on-prem middleware that reads the device SDK and forwards punches to
our ingest endpoint in that brand's format; these adapters parse those forwards.
All adapters also accept the Generic JSON shape as a fallback so integrators can
test without the physical device.
"""
from __future__ import annotations

from .base import BaseAdapter, Punch, parse_dt


class GenericAdapter(BaseAdapter):
    """Generic JSON webhook.

        {"punches": [
            {"user_id": "1001", "timestamp": "2026-07-03 08:05:00", "direction": "in"}
        ]}
    """

    brand = "generic"

    def parse(self, request):
        data = self._json(request)
        punches = []
        for row in data.get("punches", []):
            uid = str(row.get("user_id") or row.get("pin") or "").strip()
            ts = row.get("timestamp") or row.get("time")
            if not uid or not ts:
                continue
            punches.append(Punch(uid, parse_dt(ts),
                                 direction=row.get("direction", "in"), raw=row))
        return punches


class ZKTecoAdapter(BaseAdapter):
    """ZKTeco push (ATTLOG). Body is tab/space-separated text, one punch/line:

        <pin>\t<YYYY-MM-DD HH:MM:SS>\t<status>\t<verify>

    `status` 0/… = check-in, 1 = check-out. Also accepts Generic JSON.
    """

    brand = "zkteco"
    OUT_STATUSES = {"1", "3", "5"}

    def parse(self, request):
        if request.content_type and "json" in request.content_type:
            return GenericAdapter().parse(request)
        body = request.body.decode("utf-8", "ignore")
        punches = []
        for line in body.splitlines():
            parts = line.replace("\t", " ").split()
            if len(parts) < 3:
                continue
            uid = parts[0]
            ts = f"{parts[1]} {parts[2]}"
            status = parts[3] if len(parts) > 3 else "0"
            direction = "out" if status in self.OUT_STATUSES else "in"
            try:
                punches.append(Punch(uid, parse_dt(ts), direction,
                                     raw={"line": line}))
            except (ValueError, TypeError):
                continue
        return punches


class ESSLAdapter(ZKTecoAdapter):
    """ESSL devices use the same ADMS/ATTLOG push protocol as ZKTeco."""

    brand = "essl"


class SupremaAdapter(BaseAdapter):
    """Suprema BioStar 2 webhook.

        {"events": [
            {"user_id": "1001", "datetime": "2026-07-03T08:05:00", "event": "VERIFY_IN"}
        ]}
    """

    brand = "suprema"

    def parse(self, request):
        data = self._json(request)
        punches = []
        for ev in data.get("events", data.get("Event", [])):
            uid = str(ev.get("user_id") or ev.get("userID") or "").strip()
            ts = ev.get("datetime") or ev.get("timestamp")
            if not uid or not ts:
                continue
            direction = "out" if "OUT" in str(ev.get("event", "")).upper() else "in"
            punches.append(Punch(uid, parse_dt(ts), direction, raw=ev))
        return punches


class HikvisionAdapter(BaseAdapter):
    """Hikvision ISAPI access-control event.

        {"AccessControllerEvent": {"employeeNoString": "1001",
                                   "time": "2026-07-03T08:05:00",
                                   "attendanceStatus": "checkIn"}}
    Also accepts a list of such events under "events".
    """

    brand = "hikvision"

    def parse(self, request):
        data = self._json(request)
        events = data.get("events")
        if events is None:
            ace = data.get("AccessControllerEvent")
            events = [data] if ace else []
        punches = []
        for wrapper in events:
            ace = wrapper.get("AccessControllerEvent", wrapper)
            uid = str(ace.get("employeeNoString") or ace.get("employeeNo") or "").strip()
            ts = wrapper.get("dateTime") or ace.get("time") or wrapper.get("time")
            if not uid or not ts:
                continue
            direction = "out" if "out" in str(ace.get("attendanceStatus", "")).lower() else "in"
            punches.append(Punch(uid, parse_dt(ts), direction, raw=wrapper))
        return punches


class MantraAdapter(GenericAdapter):
    """Mantra MFS/MorFin forwards; middleware posts the Generic JSON shape."""

    brand = "mantra"
