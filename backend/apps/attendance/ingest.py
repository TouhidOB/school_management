"""Turn normalized device punches into platform attendance.

Runs inside a `scope_to(school)` block (see the ingest view). Resolution:
  device_user_id -> BiometricEnrollment -> Student or TeacherProfile
  * Student  -> one StudentAttendance/day (present, or late past the school's
    `attendance_late_after` time).
  * Teacher  -> one StaffAttendance/day; earliest 'in' = check_in, latest
    'out' = check_out.
Unmapped ids are logged as UNRESOLVED so an admin can enroll them later.
"""
from django.utils import timezone

from .models import (BiometricEnrollment, BiometricPunch, StaffAttendance,
                     StudentAttendance)


def ingest_punches(school, punches):
    enrollments = {e.device_user_id: e
                   for e in BiometricEnrollment.objects.filter(school=school)}
    late_after = school.attendance_late_after
    applied = unresolved = errors = 0

    for p in punches:
        uid = str(p.device_user_id)
        local = timezone.localtime(p.timestamp)
        log = BiometricPunch(school=school, device_user_id=uid,
                             punched_at=p.timestamp, direction=p.direction,
                             raw=p.raw or {})
        enr = enrollments.get(uid)
        if enr is None:
            log.status = BiometricPunch.STATUS_UNRESOLVED
            log.save()
            unresolved += 1
            continue

        log.enrollment = enr
        try:
            if enr.student_id:
                _mark_student(school, enr, local, late_after)
            elif enr.teacher_id:
                _mark_teacher(school, enr, local, p.direction)
            else:
                raise ValueError("enrollment has no person")
            log.status = BiometricPunch.STATUS_APPLIED
            applied += 1
        except Exception:
            log.status = BiometricPunch.STATUS_ERROR
            errors += 1
        log.save()

    return {"received": len(punches), "applied": applied,
            "unresolved": unresolved, "errors": errors}


def _mark_student(school, enr, local, late_after):
    student = enr.student
    if student.current_section_id is None:
        raise ValueError("student has no section")
    status = "present"
    if late_after and local.time() > late_after:
        status = "late"
    StudentAttendance.objects.update_or_create(
        student_id=enr.student_id, date=local.date(),
        defaults={"school": school, "section_id": student.current_section_id,
                  "status": status})


def _mark_teacher(school, enr, local, direction):
    att, _ = StaffAttendance.objects.get_or_create(
        teacher_id=enr.teacher_id, date=local.date(),
        defaults={"school": school, "is_present": True})
    att.is_present = True
    t = local.time()
    if direction == "out":
        if att.check_out is None or t > att.check_out:
            att.check_out = t
    if direction != "out" and (att.check_in is None or t < att.check_in):
        att.check_in = t
    if att.check_in is None:
        att.check_in = t
    att.save()
