from rest_framework import viewsets, permissions
from django.contrib.auth.models import Permission
from django.db.models import Q
from .serializers import PermissionMiniSerializer

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PermissionMiniSerializer
    permission_classes = [permissions.AllowAny]

    EXCLUDED_SUBSTRINGS = (
        'permission',
        'logentry',
        'emailverificationcode',
        'contenttype',
        'historialtasa',
        'session',
    )

    def get_queryset(self):
        qs = Permission.objects.select_related("content_type")
        q = Q()
        for s in self.EXCLUDED_SUBSTRINGS:
            q |= Q(codename__icontains=s) | Q(content_type__model__icontains=s)
        return qs.exclude(q)
