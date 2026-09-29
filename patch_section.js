const fs = require('fs');
const file = 'frontend/app/(app)/exams/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add `selectedSection` state
content = content.replace(
  "// Marks Entry State\n  const [marksFor, setMarksFor] = useState(null);",
  "// Marks Entry State\n  const [marksFor, setMarksFor] = useState(null);\n  const [selectedSection, setSelectedSection] = useState(\"\");"
);

// 2. Reset `selectedSection` in `openMarks`
content = content.replace(
  "setMarksFor(es);\n    setMsg(\"Loading...\");",
  "setMarksFor(es);\n    setSelectedSection(\"\");\n    setMsg(\"Loading...\");"
);

// 3. Update Marks Entry Card to include Section filter and filter roster
const oldCard = `{/* Marks Entry Section */}
      {marksFor && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.main', mt: 3 }}>
          <CardHeader 
            title={\`Marks Entry: \${marksFor.subject_name} (\${marksFor.class_name})\`} 
            titleTypographyProps={{ variant: 'h6', color: 'primary.main' }}
            action={msg && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mr: 2 }}>{msg}</Typography>}
          />
          <Divider />
          <CardContent>
            {roster.length === 0 ? (
              <Typography color="text.secondary">No students found in this class.</Typography>
            ) : (
              <Box>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell><strong>Roll #</strong></TableCell>
                        <TableCell><strong>Student Name</strong></TableCell>
                        <TableCell sx={{ width: 200 }}><strong>Marks Obtained (/\${marksFor.total_marks})</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roster.map(s => (
                        <TableRow key={s.id} hover>
                          <TableCell>{s.roll_number || "—"}</TableCell>
                          <TableCell>{s.full_name}</TableCell>
                          <TableCell>
                            <TextField 
                              type="number"
                              size="small"
                              fullWidth
                              value={marks[s.id]?.marks ?? ""}
                              onChange={(e) => {
                                let valStr = e.target.value;
                                if (valStr !== "") {
                                  let val = Number(valStr);
                                  if (val < 0) valStr = "0";
                                  else if (val > (marksFor.total_marks || 100)) valStr = String(marksFor.total_marks || 100);
                                }
                                setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                              }}
                              InputProps={{ inputProps: { max: marksFor.total_marks || 100, min: 0 } }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={saveMarks}>
                    Save All Marks
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}`;

const newCard = `{/* Marks Entry Section */}
      {marksFor && (() => {
        const uniqueSections = Array.from(new Set(roster.map(s => s.current_section).filter(Boolean)))
          .map(secId => ({ id: secId, name: roster.find(s => s.current_section === secId)?.section_name }));
        
        const filteredRoster = selectedSection 
          ? roster.filter(s => String(s.current_section) === String(selectedSection))
          : roster;

        return (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.main', mt: 3 }}>
            <CardHeader 
              title={\`Marks Entry: \${marksFor.subject_name} (\${marksFor.class_name})\`} 
              titleTypographyProps={{ variant: 'h6', color: 'primary.main' }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {msg && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{msg}</Typography>}
                  {uniqueSections.length > 0 && (
                    <TextField
                      select
                      size="small"
                      label="Filter by Section"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="">All Sections</MenuItem>
                      {uniqueSections.map(sec => (
                        <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {filteredRoster.length === 0 ? (
                <Typography color="text.secondary">No students found in this class/section.</Typography>
              ) : (
                <Box>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell><strong>Roll #</strong></TableCell>
                          <TableCell><strong>Student Name</strong></TableCell>
                          <TableCell sx={{ width: 200 }}><strong>Marks Obtained (/\${marksFor.total_marks})</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRoster.map(s => (
                          <TableRow key={s.id} hover>
                            <TableCell>{s.roll_number || "—"}</TableCell>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>
                              <TextField 
                                type="number"
                                size="small"
                                fullWidth
                                value={marks[s.id]?.marks ?? ""}
                                onChange={(e) => {
                                  let valStr = e.target.value;
                                  if (valStr !== "") {
                                    let val = Number(valStr);
                                    if (val < 0) valStr = "0";
                                    else if (val > (marksFor.total_marks || 100)) valStr = String(marksFor.total_marks || 100);
                                  }
                                  setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                                }}
                                InputProps={{ inputProps: { max: marksFor.total_marks || 100, min: 0 } }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={saveMarks}>
                      Save All Marks
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })()}`;

content = content.replace(oldCard, newCard);
fs.writeFileSync(file, content);
