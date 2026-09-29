const fs = require('fs');
const file = 'frontend/app/(app)/exams/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("selectedSection")) {
  content = content.replace(
    "const [marksFor, setMarksFor] = useState(null);",
    "const [marksFor, setMarksFor] = useState(null);\n  const [selectedSection, setSelectedSection] = useState(\"\");"
  );
  content = content.replace(
    "setMarksFor(es);\n    setMsg(\"Loading...\");",
    "setMarksFor(es);\n    setSelectedSection(\"\");\n    setMsg(\"Loading...\");"
  );
}

// Just replace the <CardHeader> and the filtered map
content = content.replace(
  `title={\`Marks Entry: \${marksFor.subject_name} (\${marksFor.class_name})\`}`,
  `title={\`Marks Entry: \${marksFor.subject_name} (\${marksFor.class_name})\`}`
);

// We need a safer way to replace JSX.
