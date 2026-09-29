from django.contrib import admin

from .models import ContactMessage, School, SubscriptionPlan


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "school_name", "email", "topic", "is_handled", "created_at")
    list_filter = ("is_handled", "topic")
    search_fields = ("name", "school_name", "email", "message")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "tier", "student_limit", "price_monthly", "is_active")
    list_filter = ("tier", "is_active")


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "school_type", "plan", "status", "created_at")
    list_filter = ("status", "school_type", "plan")
    search_fields = ("name", "slug", "admin_email", "custom_domain")
    prepopulated_fields = {"slug": ("name",)}
