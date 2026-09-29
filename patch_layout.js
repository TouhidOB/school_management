const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/layout.js", "utf8");

if (!content.includes("/exams/promotions")) {
  content = content.replace(
    "{ label: 'Results', path: '/exams/results' }",
    "{ label: 'Results', path: '/exams/results' },\n  { label: 'Final Promotions', path: '/exams/promotions' }"
  );
  fs.writeFileSync("frontend/app/(app)/exams/layout.js", content);
}
