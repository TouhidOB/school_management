import os

views_path = "backend/apps/tenants/api/views.py"
urls_path = "backend/apps/tenants/api/urls.py"

with open(views_path, "r") as f:
    content = f.read()

search_view_code = """
from django.db.models import Q

class GlobalSearchView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return Response({"schools": [], "users": []})
        
        # Search schools
        schools = School.all_objects.filter(
            Q(name__icontains=q) | Q(slug__icontains=q) | Q(admin_email__icontains=q)
        )[:5]
        
        # Search platform users
        users = User.objects.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q)
        ).exclude(role=User.ROLE_STUDENT)[:5]

        return Response({
            "schools": [{"id": s.id, "title": s.name, "subtitle": s.slug, "type": "School"} for s in schools],
            "users": [{"id": u.id, "title": f"{u.first_name} {u.last_name}".strip() or u.username, "subtitle": u.email, "type": "User"} for u in users]
        })
"""
if "class GlobalSearchView" not in content:
    with open(views_path, "a") as f:
        f.write("\n" + search_view_code)

with open(urls_path, "r") as f:
    urls_content = f.read()

if "GlobalSearchView" not in urls_content:
    urls_content = urls_content.replace(
        'path("platform/stats/", v.PlatformStatsView.as_view(), name="api_platform_stats"),',
        'path("platform/stats/", v.PlatformStatsView.as_view(), name="api_platform_stats"),\n    path("platform/search/", v.GlobalSearchView.as_view(), name="api_platform_search"),'
    )
    with open(urls_path, "w") as f:
        f.write(urls_content)
