const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/results/page.js", "utf8");

content = content.replace(
  "<TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>",
  "<TableContainer className=\"tabulation-sheet\" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>"
);

fs.writeFileSync("frontend/app/(app)/exams/results/page.js", content);
