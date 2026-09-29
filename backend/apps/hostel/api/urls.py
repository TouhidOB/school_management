from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("hostels", views.HostelViewSet, basename="hostel")
router.register("rooms", views.HostelRoomViewSet, basename="hostelroom")
router.register("allocations", views.HostelAllocationViewSet, basename="hostelallocation")

urlpatterns = router.urls
