import re

with open('frontend/components/Sidebar.js', 'r') as f:
    content = f.read()

# I will replace the GROUPS array and the icons.
# But using sed or python to replace the whole file is easier.
