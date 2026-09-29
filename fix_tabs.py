import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We are looking for lines like:
    # const TABS = [('Directory', '/teachers'), ('Timetable', '/timetable/teachers')];
    # and replacing with:
    # const TABS = [{label: 'Directory', path: '/teachers'}, {label: 'Timetable', path: '/timetable/teachers'}];
    
    def replacer(match):
        tuples = re.findall(r"\('([^']+)',\s*'([^']+)'\)", match.group(1))
        replacement = "const TABS = [\n  " + ",\n  ".join([f"{{ label: '{lbl}', path: '{pth}' }}" for lbl, pth in tuples]) + "\n];"
        return replacement

    new_content = re.sub(r"const TABS = \[([^\]]+)\];", replacer, content)
    
    # Also need to fix tab[0] -> tab.label and tab[1] -> tab.path
    new_content = new_content.replace('tab[0]', 'tab.label')
    new_content = new_content.replace('tab[1]', 'tab.path')
    new_content = new_content.replace('TABS[newValue][1]', 'TABS[newValue].path')

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('frontend/app'):
    for f in files:
        if f == 'layout.js':
            fix_file(os.path.join(root, f))
