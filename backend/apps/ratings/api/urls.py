from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("rating-periods", v.RatingPeriodViewSet)
router.register("teacher-ratings", v.TeacherRatingViewSet)
router.register("rating-aggregates", v.TeacherRatingAggregateViewSet)

urlpatterns = router.urls
