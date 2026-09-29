import re

with open("frontend/app/(app)/students/[id]/page.js", "r") as f:
    text = f.read()

if "Avatar" not in text:
    text = text.replace('import { useParams } from "next/navigation";', 'import { useParams } from "next/navigation";\nimport Avatar from "@mui/material/Avatar";\nimport PersonIcon from "@mui/icons-material/Person";')

old_header = """          <Button 
            component={Link} 
            href="/students" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
          >
            Students
          </Button>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {student.full_name}
            <Chip label={student.status} size="small" color={student.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admission #: {student.admission_number} | Class: {student.class_name || "—"} | Section: {student.section_name || "—"}
          </Typography>
        </Box>"""

new_header = """          <Button 
            component={Link} 
            href="/students" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
          >
            Students
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
            <Avatar src={student.photo} sx={{ width: 80, height: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {!student.photo && <PersonIcon sx={{ fontSize: 40, color: 'text.secondary' }} />}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {student.full_name}
                <Chip label={student.status} size="small" color={student.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admission #: {student.admission_number} | Class: {student.class_name || "—"} | Section: {student.section_name || "—"}
              </Typography>
            </Box>
          </Box>
        </Box>"""

if old_header in text:
    text = text.replace(old_header, new_header)
    with open("frontend/app/(app)/students/[id]/page.js", "w") as f:
        f.write(text)
    print("Patched student details successfully")
else:
    print("Old header not found!")
