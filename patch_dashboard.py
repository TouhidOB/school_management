import re

with open('frontend/components/dashboards/StudentDashboard.js', 'r') as f:
    content = f.read()

# Make sure Link is imported
if 'import Link from "next/link";' not in content:
    content = content.replace('import { useEffect', 'import Link from "next/link";\nimport { useEffect')

# Patch Quick Actions
content = content.replace('<Button variant="contained" size="small" sx={{ minWidth: 150 }}>View Timetable</Button>', '<Button component={Link} href="/timetable" variant="contained" size="small" sx={{ minWidth: 150 }}>View Timetable</Button>')
content = content.replace('<Button variant="outlined" size="small" sx={{ minWidth: 150 }}>Submit Homework</Button>', '<Button component={Link} href="/homework" variant="outlined" size="small" sx={{ minWidth: 150 }}>Submit Homework</Button>')
content = content.replace('<Button variant="outlined" size="small" sx={{ minWidth: 150 }}>View Results</Button>', '<Button component={Link} href="/exams" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Results</Button>')
content = content.replace('<Button variant="outlined" size="small" sx={{ minWidth: 150 }}>View Attendance</Button>', '<Button component={Link} href="/attendance" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Attendance</Button>')
content = content.replace('<Button variant="outlined" size="small" sx={{ minWidth: 150 }}>View Materials</Button>', '<Button component={Link} href="/learning" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Materials</Button>')

# Patch Today's Classes "View Materials"
content = content.replace('<Button variant="outlined" size="small">View Materials</Button>', '<Button component={Link} href="/learning" variant="outlined" size="small">View Materials</Button>')

# Patch Needs Attention "View"
content = content.replace('<Button size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', '<Button component={Link} href="/homework" size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', 1)
content = content.replace('<Button size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', '<Button component={Link} href="/attendance" size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', 1)
content = content.replace('<Button size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', '<Button component={Link} href="/exams" size="small" variant="text" sx={{ minWidth: \'auto\', p: 0 }}>View &rarr;</Button>', 1)

with open('frontend/components/dashboards/StudentDashboard.js', 'w') as f:
    f.write(content)
