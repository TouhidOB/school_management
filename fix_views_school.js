const fs = require('fs');
let content = fs.readFileSync("backend/apps/exams/api/views.py", "utf8");

// replace import or ensure get_active_school is imported
if (!content.includes("from apps.core.api.mixins import get_active_school")) {
  content = content.replace(
    "from apps.academics.models import SchoolClass",
    "from apps.core.api.mixins import get_active_school\nfrom apps.academics.models import SchoolClass"
  );
}

// In get_annual_results:
const oldSchoolCheck = "school = request.school.id if hasattr(request, 'school') and request.school else None";
const newSchoolCheck = `active_school = get_active_school(request)
    school = active_school.id if active_school else None
    if not school:
        school = request.user.school_id or 4`;

content = content.replaceAll(oldSchoolCheck, newSchoolCheck);

fs.writeFileSync("backend/apps/exams/api/views.py", content);
console.log("Updated views.py");
