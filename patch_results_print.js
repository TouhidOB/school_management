const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/results/page.js", "utf8");

content = content.replace(
  "<Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>",
  "<Card className=\"no-print\" elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>"
);

// Also the alert should be hidden on print
content = content.replace(
  "<Alert severity=\"info\" sx={{ mt: 2 }}>",
  "<Alert className=\"no-print\" severity=\"info\" sx={{ mt: 2 }}>"
);

fs.writeFileSync("frontend/app/(app)/exams/results/page.js", content);
