const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/layout.js", "utf8");

content = content.replace(
  '<Box sx={{ mb: 3 }}>',
  '<Box className="no-print" sx={{ mb: 3 }}>'
);

content = content.replace(
  '<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>',
  '<Box className="no-print" sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>'
);

fs.writeFileSync("frontend/app/(app)/exams/layout.js", content);
