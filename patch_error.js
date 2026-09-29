const fs = require('fs');
const file = 'frontend/app/(app)/exams/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldSave = `  async function saveMarks() {
    if (!marksFor) return;
    setMsg("Saving...");
    try {
      for (const s of roster) {
        const mk = marks[s.id];
        if (mk.marks === "" || mk.marks == null) continue;
        const body = { exam_subject: marksFor.id, student: s.id, marks_obtained: mk.marks };
        if (mk.recordId) {
          await api.patch(\`/exam-results/\${mk.recordId}/\`, { marks_obtained: mk.marks });
        } else {
          await api.post("/exam-results/", body);
        }
      }
      setMsg("Saved Successfully ✓");
      await openMarks(marksFor); // refresh
    } catch (err) {
      setMsg(\`Failed: \${err.message || err.data?.detail || err}\`);
      console.error(err);
    }
  }`;

const newSave = `  async function saveMarks() {
    if (!marksFor) return;
    setMsg("Saving...");
    try {
      for (const s of roster) {
        const mk = marks[s.id];
        if (!mk || mk.marks === "" || mk.marks == null) continue;
        const body = { exam_subject: marksFor.id, student: s.id, marks_obtained: mk.marks };
        if (mk.recordId) {
          await api.patch(\`/exam-results/\${mk.recordId}/\`, { marks_obtained: mk.marks });
        } else {
          await api.post("/exam-results/", body);
        }
      }
      setMsg("Saved Successfully ✓");
      await openMarks(marksFor); // refresh
    } catch (err) {
      setMsg(\`Error: \${err.message || JSON.stringify(err.data) || err}\`);
      console.error("Save Marks Error:", err);
    }
  }`;

content = content.replace(oldSave, newSave);
fs.writeFileSync(file, content);
