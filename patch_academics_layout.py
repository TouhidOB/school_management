import re

with open("frontend/app/(app)/academics/layout.js", "r") as f:
    text = f.read()

old_tabs = """const TABS = [
  { label: 'Overview', path: '/academics' },
  { label: 'Classes', path: '/academics/classes' },
  { label: 'Sections', path: '/academics/sections' },
  { label: 'Subjects', path: '/academics/subjects' },
  { label: 'Academic Years', path: '/academics/academic-years' }
];"""

new_tabs = """const TABS = [
  { label: 'Overview', path: '/academics' },
  { label: 'Classes', path: '/academics/classes' },
  { label: 'Sections', path: '/academics/sections' },
  { label: 'Subjects', path: '/academics/subjects' },
  { label: 'Departments', path: '/academics/departments' },
  { label: 'Designations', path: '/academics/designations' },
  { label: 'Academic Years', path: '/academics/academic-years' }
];"""

text = text.replace(old_tabs, new_tabs)

with open("frontend/app/(app)/academics/layout.js", "w") as f:
    f.write(text)

print("Academics layout patched.")
