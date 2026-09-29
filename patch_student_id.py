import re

with open('backend/apps/students/api/views.py', 'r') as f:
    content = f.read()

# Replace hardcoded ID generator with dynamic one based on school settings
old_id_logic = """        if not admission_number or admission_number.lower() == 'auto':
            year = datetime.date.today().year
            count = Student.objects.filter(school=school, admission_date__year=year).count() + 1
            admission_number = f"ADM-{year}-{count:04d}\""""

new_id_logic = """        if not admission_number or admission_number.lower() == 'auto':
            prefix = getattr(school, 'id_prefix', 'ADM').strip()
            include_year = getattr(school, 'id_include_year', True)
            digits = getattr(school, 'id_digits', 4)
            
            year_str = ""
            count_filter = {'school': school}
            
            if include_year:
                year = datetime.date.today().year
                year_str = f"{year}-"
                count_filter['admission_date__year'] = year
                
            count = Student.objects.filter(**count_filter).count() + 1
            
            format_str = f"{{prefix}}-{{year_str}}{{count:0{digits}d}}" if prefix else f"{{year_str}}{{count:0{digits}d}}"
            # Clean up double dashes if prefix is empty
            admission_number = format_str.format(prefix=prefix, year_str=year_str, count=count).replace('--', '-').strip('-')"""

content = content.replace(old_id_logic, new_id_logic)

with open('backend/apps/students/api/views.py', 'w') as f:
    f.write(content)
