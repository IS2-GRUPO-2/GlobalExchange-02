from rest_framework import viewsets, permissions, filters
from django.contrib.auth.models import Group
from .serializers import RoleSerializer
from rest_framework.pagination import PageNumberPagination

class RolePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related("permissions")
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'permissions__name']
    pagination_class = RolePagination
    
    def get_permissions(self):
        """
        Permite a usuarios autenticados ver (list, retrieve) roles,
        pero requiere DjangoModelPermissions para modificarlos.
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), permissions.DjangoModelPermissions()]
