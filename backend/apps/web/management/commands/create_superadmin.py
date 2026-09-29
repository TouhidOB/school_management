"""Create (or upgrade) a platform Super Admin account.

    python manage.py create_superadmin --email you@example.com --password secret123

Sets role=super_admin (grants the platform dashboard) plus is_staff/is_superuser
(grants Django admin at /admin/). School stays null — Super Admin is
platform-wide, not tied to any tenant.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Create or upgrade a platform Super Admin."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--name", default="Platform Admin")

    def handle(self, *args, **o):
        email = o["email"].lower()
        user, created = User.objects.get_or_create(
            username=email, defaults={"email": email, "first_name": o["name"]})
        user.email = email
        user.role = User.ROLE_SUPER_ADMIN
        user.school = None
        user.is_staff = True
        user.is_superuser = True
        user.set_password(o["password"])
        user.save()
        verb = "Created" if created else "Upgraded"
        self.stdout.write(self.style.SUCCESS(
            f"{verb} Super Admin '{email}'. Sign in at /login/ -> lands on /app/ "
            f"(platform dashboard). Django admin at /admin/."))
