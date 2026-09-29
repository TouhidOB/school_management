from django.urls import path
from .views import (
    GeneralSettingsView, EmailSettingsView,
    SMSSettingsView, StorageSettingsView, LocalizationSettingsView
)

urlpatterns = [
    path("settings/general/", GeneralSettingsView.as_view(), name="general_settings"),
    path("settings/email/", EmailSettingsView.as_view(), name="email_settings"),
    path("settings/sms/", SMSSettingsView.as_view(), name="sms_settings"),
    path("settings/storage/", StorageSettingsView.as_view(), name="storage_settings"),
    path("settings/localization/", LocalizationSettingsView.as_view(), name="localization_settings"),
]
