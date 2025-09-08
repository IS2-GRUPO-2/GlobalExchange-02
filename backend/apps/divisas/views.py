from rest_framework import permissions, viewsets, filters, status
from .serializers import DivisaSerializer, DivisaPaginatedResponseSerializer, DenominacionSerializer
from .models import Divisa, Denominacion
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.pagination import PageNumberPagination
from apps.cotizaciones.models import Tasa

class DivisaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class DivisaViewset(viewsets.ModelViewSet):
    serializer_class = DivisaSerializer
    queryset = Divisa.objects.all()
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "codigo"]
    pagination_class = DivisaPagination
    
    def get_queryset(self):
        qs = super().get_queryset()
        es_base = self.request.query_params.get("es_base")

        if es_base is not None:
            if es_base.lower() in ("true", "1"):
                qs = qs.filter(es_base=True)
            elif es_base.lower() in ("false", "0"):
                qs = qs.filter(es_base=False)

        return qs

    @swagger_auto_schema(
    operation_summary="Listar divisas",
    operation_description="Obtiene un listado paginado de todas las divisas registradas en el sistema.",
    manual_parameters=[
        openapi.Parameter(
            "page",
            openapi.IN_QUERY,
            description="Número de página a retornar.",
            type=openapi.TYPE_INTEGER
        ),
        openapi.Parameter(
            "page_size",
            openapi.IN_QUERY,
            description="Cantidad de resultados por página.",
            type=openapi.TYPE_INTEGER
        ),
    ],
    responses={200: DivisaPaginatedResponseSerializer},
)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Crear divisa",
        operation_description="Crea una nueva divisa en el sistema.",
        request_body=DivisaSerializer,
        responses={201: DivisaSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Actualizar divisa",
        operation_description="Actualiza los datos de una divisa existente.",
        request_body=DivisaSerializer,
        responses={200: DivisaSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Obtener divisa",
        operation_description="Obtiene un listado de todas las divisas registradas en el sistema.",
        responses={200: DivisaSerializer(many=True)},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Actualizar divisa parcialmente",
        operation_description="Actualiza los datos de una divisa existente.",
        request_body=DivisaSerializer,
        responses={200: DivisaSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Eliminar una divisa",
        operation_description="Marca la divisa como inactiva en lugar de borrarla físicamente.",
        manual_parameters=[
            openapi.Parameter(
                "id",
                openapi.IN_PATH,
                description="ID de la divisa a eliminar.",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: openapi.Response("Divisa desactivada correctamente."),
            404: openapi.Response("La divisa ya estaba inactiva."),
        },
    )
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (not instance.is_active):
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.is_active = False
        instance.save()
        self._desactivar_tasa_si_existe(instance)
        return Response(status=status.HTTP_200_OK)
    
    def _desactivar_tasa_si_existe(self, divisa: Divisa) -> None:
        """
        Al desactivar un divisa, tambien debe desactivar la tasa asociada.
        """
        try:
            tasa = divisa.tasa
        except Tasa.DoesNotExist:
            return
        if tasa.activo:
            tasa.activo = False
            tasa.save(update_fields=["activo"])
    
    @action(detail=True)
    def get_denominaciones(self, request, pk=None):
        divisa = self.get_object()
        denominaciones = Denominacion.objects.filter(divisa=divisa)
        serializer = DenominacionSerializer(denominaciones, many=True)
        return Response(serializer.data)
    
    
    @swagger_auto_schema(
        operation_summary="Divisas activas sin tasa",
        operation_description="Devuelve divisas activas que no tienen Tasa asociada. Soporta ?search=",
        manual_parameters=[
            openapi.Parameter("search", openapi.IN_QUERY, description="Buscar por código/nombre", type=openapi.TYPE_STRING),
            openapi.Parameter("page", openapi.IN_QUERY, description="Número de página", type=openapi.TYPE_INTEGER),
            openapi.Parameter("page_size", openapi.IN_QUERY, description="Tamaño de página", type=openapi.TYPE_INTEGER),
        ],
        responses={200: DivisaPaginatedResponseSerializer},
    )
    @action(detail=False, methods=["get"], url_path="sin_tasa")
    def sin_tasa(self, request):
        """
        Lista solo las divisas ACTIVAS que NO tienen Tasa asociada.
        Respeta SearchFilter (?search=USD).
        Pagina usando tu DivisaPagination.
        """
        qs = Divisa.objects.filter(is_active=True, tasa__isnull=True)
        qs = self.filter_queryset(qs)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    
class DenominacionViewset(viewsets.ModelViewSet):
    serializer_class = DenominacionSerializer
    queryset = Denominacion.objects.all()
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        divisa = request.data.get('divisa')
        denominacion = request.data.get('denominacion')

        if Denominacion.objects.filter(divisa=divisa, denominacion=denominacion, is_active=True).exists():
            return Response({
                "detail": "Ya existe una denominación con ese valor para esta divisa."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if (not instance.is_active):
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_200_OK)