from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cliente, CategoriaCliente
from django.contrib.auth import get_user_model
from .serializers import ClienteSerializer, CategoriaClienteSerializer, CategoriaCliente
from apps.usuarios.serializers import UserSerializer
from rest_framework.permissions import DjangoModelPermissions

User = get_user_model()

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "cedula", "ruc"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (not instance.isActive):
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.isActive = False
        instance.save()
        return Response(status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path="get_usuarios_asignados")
    def get_usuarios(self, request, pk=None):
        """Este endpoint retorna una lista de todos los usuarios que pueden operar en nombre de este cliente."""
        cliente = self.get_object()
        usuarios = cliente.usuarios.all()
        serializer = UserSerializer(usuarios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path="categorias")
    def get_categorias(self, request):
        """Este endpoint retorna todas las categorías disponibles."""
        categorias = CategoriaCliente.objects.all()
        serializer = CategoriaClienteSerializer(categorias, many=True)
        return Response(serializer.data)

class CategoriaClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de cliente.
    Permite listar, crear, editar y eliminar categorías.
    """
    queryset = CategoriaCliente.objects.all()
    serializer_class = CategoriaClienteSerializer
    permission_classes = [permissions.IsAuthenticated, DjangoModelPermissions]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "descuento", "descripcion"]

