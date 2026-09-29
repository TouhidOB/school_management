from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "school", "is_active")
    list_filter = ("role", "is_active", "school")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Tenant / Role", {"fields": ("role", "school", "phone")}),
    )
