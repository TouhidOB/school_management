from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as v

router = DefaultRouter()
router.register("tickets", v.TicketViewSet, basename="tickets")
router.register("ticket-messages", v.TicketMessageViewSet, basename="ticket_messages")
router.register("kb-categories", v.KnowledgeBaseCategoryViewSet, basename="kb_categories")
router.register("kb-articles", v.KnowledgeBaseArticleViewSet, basename="kb_articles")

urlpatterns = [
    path("platform/support/", include(router.urls)),
]
