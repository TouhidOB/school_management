import re

with open("backend/apps/students/api/views.py", "r") as f:
    text = f.read()

# Insert next_ids action after perform_create
new_action = """
    @action(detail=False, methods=['get'])
    def next_ids(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({"admission_number": "Auto-generated", "roll_number": "Auto-generated"})
            
        class_id = request.query_params.get('class_id')
        
        # Calculate next admission number
        prefix = getattr(school, 'id_prefix', 'ADM').strip()
        include_year = getattr(school, 'id_include_year', True)
        digits = getattr(school, 'id_digits', 4)
        
        year_str = ""
        count_filter = {'school': school}
        
        if include_year:
            import datetime
            year = datetime.date.today().year
            year_str = f"{year}-"
            count_filter['admission_date__year'] = year
            
        count = Student.objects.filter(**count_filter).count() + 1
        format_str = f"{{prefix}}-{{year_str}}{{count:0{digits}d}}" if prefix else f"{{year_str}}{{count:0{digits}d}}"
        next_adm = format_str.format(prefix=prefix, year_str=year_str, count=count).replace('--', '-').strip('-')
        
        # Calculate next roll number
        next_roll = "1"
        if class_id:
            students_in_class = Student.objects.filter(school=school, current_class_id=class_id)
            max_r = 0
            for st in students_in_class:
                try:
                    r = int(st.roll_number)
                    if r > max_r: max_r = r
                except Exception:
                    pass
            next_roll = str(max_r + 1)
            
        return Response({
            "admission_number": next_adm,
            "roll_number": next_roll
        })

class GuardianViewSet"""

text = text.replace("class GuardianViewSet", new_action)

with open("backend/apps/students/api/views.py", "w") as f:
    f.write(text)
