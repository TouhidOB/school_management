const fs = require('fs');
const file = 'frontend/app/(app)/exams/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldInput = `                              onChange={(e) => {
                                let valStr = e.target.value;
                                if (valStr !== "") {
                                  let val = Number(valStr);
                                  if (val < 0) val = 0;
                                  if (val > (marksFor.total_marks || 100)) val = marksFor.total_marks || 100;
                                  valStr = val.toString();
                                }
                                setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                              }}`;

const newInput = `                              onChange={(e) => {
                                let valStr = e.target.value;
                                if (valStr !== "") {
                                  let val = Number(valStr);
                                  if (val < 0) valStr = "0";
                                  else if (val > (marksFor.total_marks || 100)) valStr = String(marksFor.total_marks || 100);
                                }
                                setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                              }}`;

content = content.replace(oldInput, newInput);
fs.writeFileSync(file, content);
