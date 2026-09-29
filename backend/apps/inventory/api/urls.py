from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("categories", views.ItemCategoryViewSet, basename="itemcategory")
router.register("suppliers", views.SupplierViewSet, basename="supplier")
router.register("items", views.ItemViewSet, basename="item")
router.register("issues", views.ItemIssueViewSet, basename="itemissue")

urlpatterns = router.urls
