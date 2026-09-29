import os
import re

apps_dir = 'backend/apps'
models_data = {}

for root, dirs, files in os.walk(apps_dir):
    if 'models.py' in files:
        app_name = os.path.basename(root)
        with open(os.path.join(root, 'models.py'), 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Find class definitions
            classes = re.findall(r'class\s+([A-Za-z0-9_]+)\(.*?Models?.*?\):(.*?)(?=class\s|$)', content, flags=re.DOTALL | re.IGNORECASE)
            
            for class_name, class_body in classes:
                fields = []
                for line in class_body.split('\n'):
                    line = line.strip()
                    if '=' in line and 'models.' in line and not line.startswith('#'):
                        field_name = line.split('=')[0].strip()
                        field_type_match = re.search(r'models\.([A-Za-z0-9_]+)', line)
                        field_type = field_type_match.group(1) if field_type_match else 'Unknown'
                        fields.append((field_name, field_type))
                if fields:
                    if app_name not in models_data:
                        models_data[app_name] = []
                    models_data[app_name].append((class_name, fields))

for app, models in models_data.items():
    print(f"--- App: {app} ---")
    for model_name, fields in models:
        print(f"Model: {model_name}")
        for fname, ftype in fields:
            print(f"  {fname}: {ftype}")
