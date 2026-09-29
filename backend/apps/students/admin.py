from django.contrib import admin

from .models import AdmissionApplication, Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("cert_type", "student", "title", "issue_date", "school")
    list_filter = ("cert_type", "school")
    search_fields = ("student__full_name", "title")


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "class_applied", "status", "school", "created_at")
    list_filter = ("status", "school")
    search_fields = ("full_name", "phone", "guardian_name")
