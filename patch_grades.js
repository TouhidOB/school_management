const fs = require('fs');
const file = 'frontend/app/(app)/exams/marks/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldUpdate = `  const updateMark = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };`;

const newUpdate = `  const updateMark = (studentId, field, value) => {
    setMarksData(prev => {
      const studentData = { ...prev[studentId], [field]: value };
      
      if (field === 'marks_obtained') {
        let valStr = value;
        if (valStr === "" || valStr == null) {
          studentData.grade = "";
          studentData.grade_point = "";
        } else {
          let val = Number(valStr);
          const activeSubject = examSubjects.find(es => String(es.id) === String(selectedExamSubject));
          const totalMarks = activeSubject?.total_marks || 100;
          
          if (val < 0) valStr = "0";
          else if (val > totalMarks) valStr = String(totalMarks);
          
          val = Number(valStr);
          studentData.marks_obtained = valStr;

          const percentage = (val / totalMarks) * 100;
          if (percentage >= 80) { studentData.grade = "A+"; studentData.grade_point = "5.00"; }
          else if (percentage >= 70) { studentData.grade = "A"; studentData.grade_point = "4.00"; }
          else if (percentage >= 60) { studentData.grade = "A-"; studentData.grade_point = "3.50"; }
          else if (percentage >= 50) { studentData.grade = "B"; studentData.grade_point = "3.00"; }
          else if (percentage >= 40) { studentData.grade = "C"; studentData.grade_point = "2.00"; }
          else if (percentage >= 33) { studentData.grade = "D"; studentData.grade_point = "1.00"; }
          else { studentData.grade = "F"; studentData.grade_point = "0.00"; }
        }
      }
      
      return {
        ...prev,
        [studentId]: studentData
      };
    });
  };`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync(file, content);
