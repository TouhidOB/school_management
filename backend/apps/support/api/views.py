from rest_framework import viewsets
from apps.core.permissions import IsSuperAdmin
from apps.support.models import Ticket, TicketMessage, KnowledgeBaseCategory, KnowledgeBaseArticle
from . import serializers as s

class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Ticket.objects.all().order_by("-created_at")
    serializer_class = s.TicketSerializer
    filterset_fields = ["status", "priority", "school"]
    search_fields = ["subject", "school__name"]

class TicketMessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = TicketMessage.objects.all().order_by("created_at")
    serializer_class = s.TicketMessageSerializer
    filterset_fields = ["ticket"]

class KnowledgeBaseCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = KnowledgeBaseCategory.objects.all()
    serializer_class = s.KnowledgeBaseCategorySerializer

class KnowledgeBaseArticleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = KnowledgeBaseArticle.objects.all().order_by("-created_at")
    serializer_class = s.KnowledgeBaseArticleSerializer
    filterset_fields = ["status", "category"]
    search_fields = ["title", "content"]
