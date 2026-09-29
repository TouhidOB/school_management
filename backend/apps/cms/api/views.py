from rest_framework import viewsets
from apps.core.permissions import IsSuperAdmin
from apps.cms.models import Testimonial, FAQCategory, FAQ, Feature
from . import serializers as s

class TestimonialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Testimonial.objects.all().order_by("-created_at")
    serializer_class = s.TestimonialSerializer
    filterset_fields = ["is_active"]

class FAQCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = FAQCategory.objects.all()
    serializer_class = s.FAQCategorySerializer

class FAQViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = FAQ.objects.all()
    serializer_class = s.FAQSerializer
    filterset_fields = ["is_active", "category"]

class FeatureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Feature.objects.all()
    serializer_class = s.FeatureSerializer
    filterset_fields = ["is_active"]
