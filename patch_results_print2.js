const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/results/page.js", "utf8");

content = content.replace(
  "onClick={() => window.print()}",
  "onClick={() => window.print()}\n                    className=\"no-print\""
);

fs.writeFileSync("frontend/app/(app)/exams/results/page.js", content);
