const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/promotions/page.js", "utf8");

content = content.replace(
  "bgcolor: 'primary.main', color: 'white'",
  "bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider'"
);

fs.writeFileSync("frontend/app/(app)/exams/promotions/page.js", content);
