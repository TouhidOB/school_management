import re

paths = [
    "frontend/app/(app)/learning/page.js",
    "frontend/app/(app)/learning/live-classes/page.js"
]

for p in paths:
    with open(p, "r") as f:
        text = f.read()
    
    text = text.replace('render: (url) => url ? <MuiLink href={url} target="_blank" rel="noopener">Open Link</MuiLink> : "—"', 'render: (row) => row.url ? <MuiLink href={row.url} target="_blank" rel="noopener">Open Link</MuiLink> : "—"')
    
    text = text.replace('render: (url) => url ? <MuiLink href={url} target="_blank" rel="noopener">Join Class</MuiLink> : "—"', 'render: (row) => row.meeting_url ? <MuiLink href={row.meeting_url} target="_blank" rel="noopener">Join Class</MuiLink> : "—"')

    with open(p, "w") as f:
        f.write(text)

print("Fixed render params")
