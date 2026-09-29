const fs = require('fs');
let content = fs.readFileSync("frontend/app/(app)/exams/promotions/page.js", "utf8");

content = content.replace(
  "<TableContainer component={Paper} elevation={0}>",
  "<TableContainer component={Paper} elevation={0} className=\"tabulation-sheet\">"
);

fs.writeFileSync("frontend/app/(app)/exams/promotions/page.js", content);
