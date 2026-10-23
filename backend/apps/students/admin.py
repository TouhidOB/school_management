from django.contrib import admin

from .models import AdmissionApplication, Certificate, Student, PassingBatch, AlumniProfile


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("admission_number", "full_name", "current_class", "current_section", "status", "school")
    list_filter = ("status", "current_class", "school")
    search_fields = ("full_name", "admission_number", "roll_number")


@admin.register(PassingBatch)
class PassingBatchAdmin(admin.ModelAdmin):
    list_display = ("name", "passing_year", "graduating_class", "academic_year", "graduation_date", "school")
    list_filter = ("passing_year", "school")
    search_fields = ("name",)


@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("student", "batch", "passing_roll", "passing_result", "current_status", "current_institution", "school")
    list_filter = ("batch", "current_status", "school")
    search_fields = ("student__full_name", "student__admission_number", "current_institution", "current_occupation")


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("cert_type", "student", "title", "issue_date", "school")
    list_filter = ("cert_type", "school")
    search_fields = ("student__full_name", "title")


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "class_applied", "status", "school", "created_at")
    list_filter = ("status", "school")
    search_fields = ("full_name", "phone")

