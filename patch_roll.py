import re

with open("backend/apps/students/api/views.py", "r") as f:
    text = f.read()

# 1. Patch next_ids
old_next_roll = """        # Calculate next roll number
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
            next_roll = str(max_r + 1)"""

new_next_roll = """        section_id = request.query_params.get('section_id')
        # Calculate next roll number
        next_roll = "1"
        if class_id:
            qs = Student.objects.filter(school=school, current_class_id=class_id)
            if section_id:
                qs = qs.filter(current_section_id=section_id)
            max_r = 0
            for st in qs:
                try:
                    if st.roll_number:
                        r = int(st.roll_number)
                        if r > max_r: max_r = r
                except Exception:
                    pass
            next_roll = str(max_r + 1)"""
text = text.replace(old_next_roll, new_next_roll)

# 2. Patch perform_create
old_perform = """        if not roll_number or roll_number.lower() == 'auto':
            current_class = data.get('current_class')
            if current_class:
                students_in_class = Student.objects.filter(school=school, current_class=current_class)
                max_r = 0
                for st in students_in_class:
                    try:
                        r = int(st.roll_number)
                        if r > max_r: max_r = r
                    except Exception:
                        pass
                roll_number = str(max_r + 1)"""

new_perform = """        if not roll_number or roll_number.lower() == 'auto':
            current_class = data.get('current_class')
            current_section = data.get('current_section')
            if current_class:
                qs = Student.objects.filter(school=school, current_class=current_class)
                if current_section:
                    qs = qs.filter(current_section=current_section)
                max_r = 0
                for st in qs:
                    try:
                        if st.roll_number:
                            r = int(st.roll_number)
                            if r > max_r: max_r = r
                    except Exception:
                        pass
                roll_number = str(max_r + 1)"""
text = text.replace(old_perform, new_perform)

with open("backend/apps/students/api/views.py", "w") as f:
    f.write(text)
print("Patched backend roll logic")
