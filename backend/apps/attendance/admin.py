from django.contrib import admin

from .models import BiometricEnrollment, BiometricPunch


@admin.register(BiometricEnrollment)
class BiometricEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("device_user_id", "label", "kind", "school")
    list_filter = ("school",)
    search_fields = ("device_user_id", "label")


@admin.register(BiometricPunch)
class BiometricPunchAdmin(admin.ModelAdmin):
    list_display = ("device_user_id", "punched_at", "direction", "status", "school")
    list_filter = ("status", "school")
    search_fields = ("device_user_id",)
