from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as v

router = DefaultRouter()
router.register("rooms", v.ClassRoomViewSet)
router.register("room-notes", v.NoteViewSet)
router.register("assignments", v.AssignmentViewSet)
router.register("submissions", v.AssignmentSubmissionViewSet)
router.register("room-posts", v.RoomPostViewSet)
router.register("room-memberships", v.RoomMembershipViewSet)

urlpatterns = router.urls
