with open("frontend/app/(super-admin)/platform/tenants/[id]/page.js", "r") as f:
    text = f.read()

# Add useAuth import if not exists
if "useAuth" not in text:
    text = text.replace('import { api, activeSchool } from "@/lib/api";', 'import { api } from "@/lib/api";\nimport { useAuth } from "@/context/AuthContext";')
    text = text.replace('import { api } from "@/lib/api";', 'import { api } from "@/lib/api";\nimport { useAuth } from "@/context/AuthContext";')

# Inject enterSchool inside the component
if "const { enterSchool } = useAuth();" not in text:
    text = text.replace("export default function TenantDetail() {", "export default function TenantDetail() {\n  const { enterSchool } = useAuth();")

# Replace activeSchool.set with enterSchool
text = text.replace("activeSchool.set(id);", "enterSchool(id);")
text = text.replace("activeSchool.set(id)", "enterSchool(id)")

with open("frontend/app/(super-admin)/platform/tenants/[id]/page.js", "w") as f:
    f.write(text)

print("Patched platform tenants page.")
