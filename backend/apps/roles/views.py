from rest_framework import viewsets, permissions, filters
from django.contrib.auth.models import Group
from .serializers import RoleSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related("permissions")
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'permissions__name']

