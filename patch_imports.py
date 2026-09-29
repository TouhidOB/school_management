with open("frontend/app/(app)/students/[id]/page.js", "r") as f:
    text = f.read()

text = text.replace(
    'import { useParams, useRouter } from "next/navigation";',
    'import { useParams, useRouter } from "next/navigation";\nimport Avatar from "@mui/material/Avatar";\nimport PersonIcon from "@mui/icons-material/Person";'
)

with open("frontend/app/(app)/students/[id]/page.js", "w") as f:
    f.write(text)
