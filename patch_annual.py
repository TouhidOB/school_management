import re
with open("backend/apps/exams/api/views.py", "r") as f:
    content = f.read()

annual_views = """
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.students.models import Student
from apps.academics.models import SchoolClass
from apps.exams.models import ExamResult, StudentPromotion

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_annual_results(request):
    academic_year_id = request.query_params.get("academic_year")
    class_id = request.query_params.get("class_id")
    school = request.user.active_school_id
    
    if not academic_year_id or not class_id:
        return Response({"error": "Missing params"}, status=400)
        
    results = (ExamResult.objects
               .filter(student__school_id=school, 
                       student__current_class_id=class_id,
                       exam_subject__exam_session__academic_year_id=academic_year_id)
               .select_related("student", "exam_subject"))
               
    agg = {}
    for r in results:
        a = agg.setdefault(r.student_id, {
            "student_id": r.student_id,
            "student_name": r.student.full_name,
            "roll_number": r.student.roll_number,
            "current_class_id": r.student.current_class_id,
            "obtained": 0.0, "possible": 0,
        })
        a["obtained"] += float(r.marks_obtained or 0)
        a["possible"] += int(r.exam_subject.total_marks or 0)
        
    rows = list(agg.values())
    for a in rows:
        a["percentage"] = round(a["obtained"] / a["possible"] * 100, 2) if a["possible"] else 0
        a["status"] = "Pass" if a["percentage"] >= 33 else "Fail"
        
    rows.sort(key=lambda x: x["obtained"], reverse=True)
    for i, a in enumerate(rows, start=1):
        a["rank"] = i
        
    return Response(rows)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def annual_promote(request):
    academic_year_id = request.data.get("academic_year")
    class_id = request.data.get("class_id")
    pass_pct = float(request.data.get("pass_percentage", 33))
    move = bool(request.data.get("move"))
    school = request.user.active_school_id
    
    if not academic_year_id or not class_id:
        return Response({"error": "Missing params"}, status=400)
        
    # Recompute annual results
    results = (ExamResult.objects
               .filter(student__school_id=school, 
                       student__current_class_id=class_id,
                       exam_subject__exam_session__academic_year_id=academic_year_id)
               .select_related("student", "exam_subject"))
               
    agg = {}
    for r in results:
        a = agg.setdefault(r.student_id, {
            "student_id": r.student_id,
            "current_class_id": r.student.current_class_id,
            "obtained": 0.0, "possible": 0,
        })
        a["obtained"] += float(r.marks_obtained or 0)
        a["possible"] += int(r.exam_subject.total_marks or 0)
        
    rows = list(agg.values())
    for a in rows:
        a["percentage"] = round(a["obtained"] / a["possible"] * 100, 2) if a["possible"] else 0
        
    classes = list(SchoolClass.objects.filter(school_id=school).order_by("numeric_level"))
    next_of = {}
    for i, c in enumerate(classes):
        next_of[c.id] = classes[i + 1].id if i + 1 < len(classes) else None
        
    # We will use the last ExamSession as the foreign key for StudentPromotion if needed, 
    # but StudentPromotion requires an exam_session. We can get any session in this year.
    from apps.exams.models import ExamSession
    session = ExamSession.objects.filter(academic_year_id=academic_year_id, school_id=school).order_by('-id').first()
    
    created = 0
    for row in rows:
        promoted = row["percentage"] >= pass_pct
        to_class_id = next_of.get(row["current_class_id"]) if promoted else row["current_class_id"]
        
        if session:
            StudentPromotion.objects.update_or_create(
                exam_session=session, student_id=row["student_id"],
                defaults=dict(
                    school_id=school,
                    from_class_id=row["current_class_id"],
                    to_class_id=to_class_id,
                    percentage=row["percentage"], rank=0, # Annual rank skipped for now
                    promoted=promoted, promoted_by=request.user,
                ),
            )
        created += 1
        if move and promoted and to_class_id:
            Student.objects.filter(pk=row["student_id"]).update(current_class_id=to_class_id)
            
    return Response({"processed": created, "moved": move})
"""

if "get_annual_results" not in content:
    content += "\n\n" + annual_views
    with open("backend/apps/exams/api/views.py", "w") as f:
        f.write(content)
    print("Added annual views")
else:
    print("Already added")
