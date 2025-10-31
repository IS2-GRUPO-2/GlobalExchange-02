from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Tauser
from .serializers import TauserSerializer, TauserPaginatedResponseSerializer
from rest_framework.permissions import DjangoModelPermissions
from rest_framework.decorators import action


class TauserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class TauserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tausers (terminales de autoservicio).
    Permite listar, crear, editar y eliminar Tausers.
    """
    queryset = Tauser.objects.all().order_by('codigo')
    serializer_class = TauserSerializer
    permission_classes = [permissions.IsAuthenticated, DjangoModelPermissions]

    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "codigo", "direccion", "ciudad", "departamento"]
    pagination_class = TauserPagination

    # Mantener la autenticación para todas las acciones (incluyendo list/retrieve)

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            value = is_active.lower()
            if value in ("true", "1", "yes"):
                queryset = queryset.filter(is_active=True)
            elif value in ("false", "0", "no"):
                queryset = queryset.filter(is_active=False)
        return queryset

    @swagger_auto_schema(
        operation_summary="Listar Tausers",
        operation_description="""Obtiene un listado paginado de todos los Tausers registrados en el sistema.
        
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
                description="Filtrar por nombre, código, dirección, ciudad o departamento.",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                "all",
                openapi.IN_QUERY,
                description="Retornar todos los Tausers sin paginar.",
                type=openapi.TYPE_STRING,
                required=False
            ),
        ],
        responses={
            200: openapi.Response(
                description="Lista de Tausers",
                schema=TauserPaginatedResponseSerializer
            )
        },
    )
    def list(self, request, *args, **kwargs):
        """
        Listado de Tausers con opción de paginado o retorno completo (?all=true).
        """
        if request.query_params.get('all', '').lower() == 'true':
            queryset = self.filter_queryset(self.get_queryset())
            serializer = TauserSerializer(queryset, many=True)
            return Response(serializer.data)

        return super().list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete: marca el Tauser como inactivo en lugar de eliminarlo.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_200_OK)
