from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    GeneralSettingsSerializer, EmailSettingsSerializer,
    SMSSettingsSerializer, StorageSettingsSerializer,
    LocalizationSettingsSerializer
)
from apps.core.models import (
    GeneralSettings, EmailSettings, SMSSettings,
    StorageSettings, LocalizationSettings
)
from apps.core.permissions import IsSuperAdmin

class SingletonRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get_object(self):
        return self.queryset.model.load()

class GeneralSettingsView(SingletonRetrieveUpdateView):
    queryset = GeneralSettings.objects.all()
    serializer_class = GeneralSettingsSerializer

class EmailSettingsView(SingletonRetrieveUpdateView):
    queryset = EmailSettings.objects.all()
    serializer_class = EmailSettingsSerializer

class SMSSettingsView(SingletonRetrieveUpdateView):
    queryset = SMSSettings.objects.all()
    serializer_class = SMSSettingsSerializer

class StorageSettingsView(SingletonRetrieveUpdateView):
    queryset = StorageSettings.objects.all()
    serializer_class = StorageSettingsSerializer

class LocalizationSettingsView(SingletonRetrieveUpdateView):
    queryset = LocalizationSettings.objects.all()
    serializer_class = LocalizationSettingsSerializer
