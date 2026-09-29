with open("backend/apps/academics/api/serializers.py", "a") as f:
    f.write("""
class StudyMaterialSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = models.StudyMaterial
        fields = "__all__"
        read_only_fields = ["school", "uploaded_by"]

class OnlineClassSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = models.OnlineClass
        fields = "__all__"
        read_only_fields = ["school", "host"]
""")

with open("backend/apps/academics/api/views.py", "a") as f:
    f.write("""
class StudyMaterialViewSet(SchoolScopedViewSet):
    queryset = models.StudyMaterial.objects.select_related("school_class", "subject").all()
    serializer_class = s.StudyMaterialSerializer
    filterset_fields = ["school_class", "subject"]
    search_fields = ["title", "description"]

    def perform_create(self, serializer):
        teacher = getattr(self.request.user, "teacherprofile", None)
        serializer.save(school=self._active_school, uploaded_by=teacher)

class OnlineClassViewSet(SchoolScopedViewSet):
    queryset = models.OnlineClass.objects.select_related("school_class", "subject").all()
    serializer_class = s.OnlineClassSerializer
    filterset_fields = ["school_class", "subject"]
    search_fields = ["topic"]

    def perform_create(self, serializer):
        teacher = getattr(self.request.user, "teacherprofile", None)
        serializer.save(school=self._active_school, host=teacher)
""")

with open("backend/apps/academics/api/urls.py", "r") as f:
    text = f.read()

text = text.replace(
    "router.register(r'events', views.EventViewSet, basename='event')",
    "router.register(r'events', views.EventViewSet, basename='event')\nrouter.register(r'study-materials', views.StudyMaterialViewSet, basename='studymaterial')\nrouter.register(r'online-classes', views.OnlineClassViewSet, basename='onlineclass')"
)

with open("backend/apps/academics/api/urls.py", "w") as f:
    f.write(text)

print("Patched academics API")
