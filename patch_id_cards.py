import re

new_box = """          <Box 
            key={student.id}
            className="print-doc" 
            sx={{ 
              width: "5.40cm", 
              height: "8.56cm", 
              borderRadius: 2, 
              overflow: "hidden", 
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              border: '1px solid #e2e8f0',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              pageBreakInside: 'avoid',
              mb: 2
            }}
          >
            {/* Header Ribbon */}
            <Box sx={{ background: color, color: "#fff", py: 1, px: 1, textAlign: "center" }}>
              <Typography fontWeight="bold" sx={{ fontSize: 11, letterSpacing: 0.2, textTransform: 'uppercase', lineHeight: 1.2 }}>
                {school?.name || "School Name"}
              </Typography>
              <Typography sx={{ opacity: 0.9, display: 'block', mt: 0.25, fontSize: 8, lineHeight: 1.1 }}>
                {school?.address || "School Address"}
              </Typography>
            </Box>

            {/* Body */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1.5, flexGrow: 1 }}>
              <Avatar 
                src={student.photo} 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mb: 1, 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  border: `2px solid ${color}`
                }}
              >
                {!student.photo && <PersonIcon sx={{ fontSize: 40, color: 'text.secondary' }} />}
              </Avatar>
              
              <Typography fontWeight="bold" sx={{ mb: 0.25, color: 'text.primary', textAlign: 'center', fontSize: 13, lineHeight: 1.1 }}>
                {student.full_name}
              </Typography>
              <Typography sx={{ color: color, fontWeight: 'bold', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9 }}>
                Student
              </Typography>

              <Box sx={{ width: '100%', mt: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 9 }}>Adm #</Typography>
                  <Typography sx={{ fontWeight: 'medium', fontSize: 9 }}>{student.admission_number}</Typography>
                </Box>
                <Divider sx={{ my: 0.25 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 9 }}>Class</Typography>
                  <Typography sx={{ fontWeight: 'medium', fontSize: 9 }}>{student.class_name || "—"}</Typography>
                </Box>
                <Divider sx={{ my: 0.25 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 9 }}>Roll No</Typography>
                  <Typography sx={{ fontWeight: 'medium', fontSize: 9 }}>{student.roll_number || "—"}</Typography>
                </Box>
                <Divider sx={{ my: 0.25 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 9 }}>Blood Grp</Typography>
                  <Typography sx={{ fontWeight: 'medium', fontSize: 9, color: 'error.main' }}>{student.blood_group || "—"}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ background: "#f8fafc", p: 0.75, textAlign: "center", borderTop: '1px solid #e2e8f0' }}>
              <Typography sx={{ color: "text.secondary", fontSize: 7, display: 'block', lineHeight: 1.1 }}>
                If found, please return to {school?.name || "School"}.
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 8, fontWeight: 'bold', lineHeight: 1.1 }}>
                {school?.phone || ""}
              </Typography>
            </Box>
          </Box>"""

# Replace in frontend/app/print/class/[id]/id-cards/page.js
file1 = "frontend/app/print/class/[id]/id-cards/page.js"
with open(file1, "r") as f:
    text1 = f.read()

text1 = re.sub(r'<Box \n *key=\{student\.id\}\n *className="print-doc".*?</Box>\n *</Box>', new_box + '\n        ))}    \n      </Box>', text1, flags=re.DOTALL)
with open(file1, "w") as f:
    f.write(text1)

# Replace in frontend/app/print/student/[id]/id-card/page.js
file2 = "frontend/app/print/student/[id]/id-card/page.js"
with open(file2, "r") as f:
    text2 = f.read()

new_box_single = new_box.replace("          <Box \n            key={student.id}\n            className=\"print-doc\"", "        <Box \n          className=\"print-doc\"")
text2 = re.sub(r'<Box \n *className="print-doc".*?</Box>\n *</PrintFrame>', new_box_single + '\n    </PrintFrame>', text2, flags=re.DOTALL)

with open(file2, "w") as f:
    f.write(text2)

print("Updated both print files.")
