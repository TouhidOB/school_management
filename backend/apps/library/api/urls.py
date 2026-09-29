from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("categories", views.BookCategoryViewSet, basename="bookcategory")
router.register("books", views.BookViewSet, basename="book")
router.register("issues", views.BookIssueViewSet, basename="bookissue")

urlpatterns = router.urls
