import os
import re

def extract_title_and_actions(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Try to find Typography headers (usually h4, h5, or h6)
            title_match = re.search(r'<Typography[^>]*variant="h[456]"[^>]*>\s*([^<]+)\s*</Typography>', content)
            title = title_match.group(1).strip() if title_match else ""
            
            # Find buttons indicating actions (e.g., "Add Student", "New Exam")
            action_matches = re.findall(r'<Button[^>]*>\s*([^<]+)\s*</Button>', content)
            # filter out simple icons or common UI stuff
            actions = [a.strip() for a in action_matches if a.strip() and len(a.strip()) > 3 and not a.strip().startswith('<')]
            actions = list(set(actions)) # unique
            
            # If no Typography title, look for export default function name
            if not title:
                func_match = re.search(r'export default function\s+([A-Za-z0-9_]+)', content)
                title = func_match.group(1) if func_match else "Unknown Page"
                
            return title, actions
    except Exception as e:
        return "Error reading", []

results = {}

for root, dirs, files in os.walk('frontend/app'):
    for file in files:
        if file in ['page.js', 'page.tsx']:
            filepath = os.path.join(root, file)
            # Get the route path
            route = root.replace('frontend/app', '') or '/'
            
            # Skip some dynamic route noise in grouping, but keep them for feature extraction
            group = route.split('/')[2] if route.startswith('/(app)/') or route.startswith('/(super-admin)/') else route.split('/')[1] if len(route.split('/')) > 1 else 'Core'
            
            title, actions = extract_title_and_actions(filepath)
            
            if group not in results:
                results[group] = []
            
            results[group].append({
                'route': route.replace('\\', '/'),
                'title': title,
                'actions': actions
            })

# Format as Markdown
md_content = "# Comprehensive System Feature List\n\n"

for group, pages in sorted(results.items()):
    group_name = group.replace('-', ' ').title()
    md_content += f"## {group_name} Module\n"
    for page in sorted(pages, key=lambda x: x['route']):
        md_content += f"### {page['route']}\n"
        md_content += f"**Page Title/Component:** {page['title']}\n"
        if page['actions']:
            md_content += f"**Key Actions/Features:** {', '.join(page['actions'][:5])}\n"
        md_content += "\n"

with open('system_feature_list.md', 'w', encoding='utf-8') as f:
    f.write(md_content)

print("Extraction complete. Output written to system_feature_list.md")
