const fs = require('fs');
let content = fs.readFileSync("backend/apps/exams/api/views.py", "utf8");

content = content.replace(
  "school = request.user.active_school_id",
  "school = request.school.id if hasattr(request, 'school') and request.school else None"
);

content = content.replace(
  "school = request.user.active_school_id",
  "school = request.school.id if hasattr(request, 'school') and request.school else None"
);

fs.writeFileSync("backend/apps/exams/api/views.py", content);
