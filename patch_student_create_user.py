import re

with open("backend/apps/students/api/views.py", "r") as f:
    text = f.read()

new_action = """
    @action(detail=True, methods=['post'])
    def create_user_account(self, request, pk=None):
        student = self.get_object()
        if student.user:
            return Response({"detail": "User already exists", "email": student.user.email})
            
        email = request.data.get("email")
        if not email:
            # Fallback to generating an email if none provided
            email = f"student_{student.admission_number.lower()}@demo.local".replace("-", "")
            
        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already in use"}, status=400)
            
        password = request.data.get("password", "student123")
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role=User.ROLE_STUDENT,
            school=student.school,
            first_name=student.full_name.split()[0],
            last_name=" ".join(student.full_name.split()[1:]) if " " in student.full_name else ""
        )
        student.user = user
        student.save()
        
        return Response({"detail": "User created", "email": user.email})

class GuardianViewSet"""

text = text.replace("class GuardianViewSet", new_action)

with open("backend/apps/students/api/views.py", "w") as f:
    f.write(text)
