from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as v

router = DefaultRouter()
router.register("testimonials", v.TestimonialViewSet, basename="testimonials")
router.register("faq-categories", v.FAQCategoryViewSet, basename="faq_categories")
router.register("faqs", v.FAQViewSet, basename="faqs")
router.register("features", v.FeatureViewSet, basename="features")

urlpatterns = [
    path("platform/cms/", include(router.urls)),
]
