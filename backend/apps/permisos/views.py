from rest_framework import viewsets, permissions
from django.contrib.auth.models import Permission
from .serializers import PermissionMiniSerializer

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.select_related("content_type").all()
    serializer_class = PermissionMiniSerializer
    permission_classes = [permissions.AllowAny]