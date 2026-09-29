const fs = require('fs');
let content = fs.readFileSync("backend/apps/exams/api/urls.py", "utf8");

if (!content.includes("annual-results")) {
  content = content.replace("urlpatterns = router.urls", "urlpatterns = [\n    path('annual-results/', v.get_annual_results),\n    path('annual-promote/', v.annual_promote),\n] + router.urls");
  fs.writeFileSync("backend/apps/exams/api/urls.py", content);
}
