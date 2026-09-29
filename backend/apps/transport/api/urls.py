from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("vehicles", views.VehicleViewSet, basename="vehicle")
router.register("routes", views.RouteViewSet, basename="route")
router.register("allocations", views.TransportAllocationViewSet, basename="transportallocation")

urlpatterns = router.urls
