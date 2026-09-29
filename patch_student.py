import sys

content = open('frontend/app/(app)/students/[id]/page.js').read()

# Import useAuth
if 'import { useAuth }' not in content:
    content = content.replace('import { useParams } from "next/navigation";', 'import { useParams, useRouter } from "next/navigation";\nimport { useAuth } from "@/context/AuthContext";')

# Inject hooks
if 'const { user, enterStudent } = useAuth();' not in content:
    content = content.replace('const { id } = useParams();', 'const { id } = useParams();\n  const router = useRouter();\n  const { user, enterStudent } = useAuth();')

# Inject button near Edit button
button_code = """
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            <Button variant="outlined" component={Link} href={`/print/student/${id}/id-card`} startIcon={<BadgeIcon />}>ID card</Button>
"""
import_dashboard_icon = 'import DashboardIcon from "@mui/icons-material/Dashboard";'
if 'DashboardIcon' not in content:
    content = content.replace('import PrintIcon from "@mui/icons-material/Print";', 'import PrintIcon from "@mui/icons-material/Print";\n' + import_dashboard_icon)

content = content.replace('<Box sx={{ display: \'flex\', gap: 2 }}>\n          <Button variant="outlined" component={Link} href={`/print/student/${id}/id-card`} startIcon={<BadgeIcon />}>ID card</Button>', button_code)
# What if it's already modified? 
open('frontend/app/(app)/students/[id]/page.js', 'w').write(content)
