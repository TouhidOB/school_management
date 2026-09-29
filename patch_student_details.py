import re

with open("frontend/app/(app)/students/[id]/page.js", "r") as f:
    text = f.read()

# Add Avatar import
if "Avatar" not in text:
    text = text.replace('import { useParams } from "next/navigation";', 'import { useParams } from "next/navigation";\nimport Avatar from "@mui/material/Avatar";\nimport PersonIcon from "@mui/icons-material/Person";')

old_header = """      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {student.full_name}
            <Chip label={student.status} color="success" size="small" sx={{ textTransform: 'capitalize' }} />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Admission #: {student.admission_number || "—"} | Class: {student.class_name || "—"} | Section: {student.section_name || "—"}
          </Typography>
        </Box>"""

new_header = """      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar 
            src={student.photo} 
            sx={{ width: 80, height: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {!student.photo && <PersonIcon sx={{ fontSize: 40, color: 'text.secondary' }} />}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {student.full_name}
              <Chip label={student.status} color="success" size="small" sx={{ textTransform: 'capitalize' }} />
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Admission #: {student.admission_number || "—"} | Class: {student.class_name || "—"} | Section: {student.section_name || "—"}
            </Typography>
          </Box>
        </Box>"""

if old_header in text:
    text = text.replace(old_header, new_header)
    with open("frontend/app/(app)/students/[id]/page.js", "w") as f:
        f.write(text)
    print("Patched student details successfully")
else:
    print("Old header not found!")
