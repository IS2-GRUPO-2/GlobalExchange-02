from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cliente, CategoriaCliente
from apps.operaciones.models import Transaccion
from apps.operaciones.serializers import TransaccionSerializer
from django.contrib.auth import get_user_model
from .serializers import ClienteSerializer, CategoriaClienteSerializer, CategoriaCliente, ClientePaginatedResponseSerializer
from apps.usuarios.serializers import UserSerializer
from rest_framework.permissions import DjangoModelPermissions
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
User = get_user_model()

class ClientePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "cedula", "ruc"]
    pagination_class = ClientePagination

    @swagger_auto_schema(
    operation_summary="Listar clientes",
    operation_description="""Obtiene un listado paginado de todos los clientes registrados en el sistema.
    
    La respuesta está paginada con las siguientes características:
    - Tamaño de página predeterminado: 10 items
    - Tamaño máximo de página: 100 items
    - Se puede navegar usando los parámetros page y page_size
    """,
        manual_parameters=[
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                description="Número de página a retornar (1 para primera página).",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                "page_size",
                openapi.IN_QUERY,
                description="Cantidad de resultados por página (entre 1 y 100).",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                "search",
                openapi.IN_QUERY,
                description="Filtrar por nombre, cédula o RUC del cliente.",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                "all",
                openapi.IN_QUERY,
                description="Retornar todos los clientes sin paginar.",
                type=openapi.TYPE_STRING,
                required=False
            ),
        ],
        responses={
            200: openapi.Response(
                description="Lista de clientes",
                schema=ClientePaginatedResponseSerializer
            )
        },
    )
    def list(self, request, *args, **kwargs):
    # Check for 'all' parameter
        if request.query_params.get('all', '').lower() == 'true':
            queryset = self.filter_queryset(self.get_queryset())
            serializer = ClienteSerializer(queryset, many=True)
            return Response(serializer.data)

        # Default paginated response
        return super().list(request, *args, **kwargs)

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

    @action(detail=True, methods=['get'], url_path="get_historial_transacciones")
    def get_transacciones(self, request, pk):
        _cliente = self.get_object()
        transacciones = Transaccion.objects.filter(cliente=_cliente)    
        serializer = TransaccionSerializer(transacciones, many=True)
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
    
    def list(self, request, *args, **kwargs):
        """
        Obtener listado de categorías. Por defecto solo muestra las activas.
        Usar ?all=true para mostrar también las inactivas.
        """
        if request.query_params.get('all', '').lower() == 'true':
            queryset = self.filter_queryset(self.get_queryset())
        else:
            queryset = self.filter_queryset(self.get_queryset().filter(is_active=True))
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (not instance.is_active):
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_200_OK)
    


