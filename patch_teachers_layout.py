import re

with open("frontend/app/(app)/teachers/layout.js", "r") as f:
    text = f.read()

old_tabs = """const TABS = [
  { label: "Directory", path: "/teachers", exact: true },
  { label: "Designations", path: "/teachers/designations", exact: false },
  { label: "Subject Assignment", path: "/teachers/assign-subjects", exact: false },
];"""

new_tabs = """const TABS = [
  { label: "Directory", path: "/teachers", exact: true },
  { label: "Subject Assignment", path: "/teachers/assign-subjects", exact: false },
];"""

text = text.replace(old_tabs, new_tabs)

with open("frontend/app/(app)/teachers/layout.js", "w") as f:
    f.write(text)

print("Teachers layout patched.")
