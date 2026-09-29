const fs = require('fs');
const file = 'frontend/app/(app)/exams/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldInput = `<TextField 
                              type="number"
                              size="small"
                              fullWidth
                              value={marks[s.id]?.marks ?? ""}
                              onChange={(e) => setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: e.target.value } }))}
                              InputProps={{ inputProps: { max: marksFor.total_marks, min: 0 } }}
                            />`;

const newInput = `<TextField 
                              type="number"
                              size="small"
                              fullWidth
                              value={marks[s.id]?.marks ?? ""}
                              onChange={(e) => {
                                let valStr = e.target.value;
                                if (valStr !== "") {
                                  let val = Number(valStr);
                                  if (val < 0) val = 0;
                                  if (val > (marksFor.total_marks || 100)) val = marksFor.total_marks || 100;
                                  valStr = val.toString();
                                }
                                setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                              }}
                              InputProps={{ inputProps: { max: marksFor.total_marks || 100, min: 0 } }}
                            />`;

content = content.replace(oldInput, newInput);
fs.writeFileSync(file, content);
