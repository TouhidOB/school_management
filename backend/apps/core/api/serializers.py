from rest_framework import serializers
from apps.core.models import (
    GeneralSettings, EmailSettings, SMSSettings,
    StorageSettings, LocalizationSettings
)

class GeneralSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralSettings
        fields = '__all__'

class EmailSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSettings
        fields = '__all__'

class SMSSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSSettings
        fields = '__all__'

class StorageSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageSettings
        fields = '__all__'

class LocalizationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalizationSettings
        fields = '__all__'
