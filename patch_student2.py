import re

with open('frontend/app/(app)/students/[id]/page.js', 'r') as f:
    content = f.read()

# Make sure imports are present
if 'useAuth' not in content:
    content = content.replace('import { useParams }', 'import { useParams, useRouter }')
    content = content.replace('from "next/navigation";', 'from "next/navigation";\nimport { useAuth } from "@/context/AuthContext";')

if 'DashboardIcon' not in content:
    content = content.replace('import PrintIcon', 'import DashboardIcon from "@mui/icons-material/Dashboard";\nimport PrintIcon')

if 'enterStudent' not in content:
    content = content.replace('const { id } = useParams();', 'const { id } = useParams();\n  const router = useRouter();\n  const { user, enterStudent } = useAuth();')

# Inject button
button_html = """
          {(user?.role === 'super_admin' || user?.role === 'school_admin' || user?.is_super_admin) && (
            <Button 
              onClick={() => {
                enterStudent(student.id);
                router.push('/dashboard');
              }}
              variant="contained" 
              color="info"
              startIcon={<DashboardIcon />}
              sx={{ textTransform: 'none' }}
            >
              Access Student Panel
            </Button>
          )}
"""

if 'Access Student Panel' not in content:
    content = content.replace('<Box sx={{ display: \'flex\', gap: 2 }}>\n          <Button \n            component="a" \n            href={`/print/student/${id}/id-card`}', 
                              '<Box sx={{ display: \'flex\', gap: 2 }}>\n' + button_html + '          <Button \n            component="a" \n            href={`/print/student/${id}/id-card`}')

with open('frontend/app/(app)/students/[id]/page.js', 'w') as f:
    f.write(content)

