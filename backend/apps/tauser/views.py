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

    @swagger_auto_schema(
        operation_summary="Listar Tausers con stock disponible",
        operation_description="""
        Retorna los Tausers que tienen stock suficiente para una operación específica.
        
        Lógica de filtrado:
        - COMPRA (casa compra del cliente): Tauser debe tener stock de divisaDestino
        - VENTA (casa vende al cliente): Tauser debe tener stock de divisaOrigen
        
        El stock se valida que sea mayor a 0 para la divisa correspondiente.
        """,
        manual_parameters=[
            openapi.Parameter(
                "divisa_id",
                openapi.IN_QUERY,
                description="ID de la divisa a verificar stock",
                type=openapi.TYPE_INTEGER,
                required=True
            ),
            openapi.Parameter(
                "monto",
                openapi.IN_QUERY,
                description="Monto de la operación (para futuras validaciones)",
                type=openapi.TYPE_NUMBER,
                required=False
            ),
        ],
        responses={
            200: openapi.Response(
                description="Lista de Tausers con stock disponible",
                schema=TauserSerializer(many=True)
            ),
            400: openapi.Response(description="Parámetros inválidos"),
        },
    )
    @action(detail=False, methods=["get"], url_path="con-stock")
    def con_stock(self, request):
        """
        Lista Tausers activos que tienen stock disponible para una divisa específica.
        Valida si existe una combinación de denominaciones (considerando el stock) que cubra
        exactamente el monto de la operación.
        """
        from apps.stock.models import StockDivisaTauser
        from decimal import Decimal

        divisa_id = request.query_params.get('divisa_id')
        monto = request.query_params.get('monto')

        if not divisa_id:
            return Response(
                {"detail": "El parámetro 'divisa_id' es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not monto:
            return Response(
                {"detail": "El parámetro 'monto' es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            divisa_id = int(divisa_id)
            monto = Decimal(str(monto))
        except Exception:
            return Response(
                {"detail": "Los parámetros 'divisa_id' y 'monto' deben ser valores numéricos válidos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener todos los tausers activos
        tausers_activos = Tauser.objects.filter(is_active=True)

        # Aplicar filtros de búsqueda si existen
        tausers_activos = self.filter_queryset(tausers_activos)

        tausers_con_stock_suficiente = []

        def puede_cubrir_monto(monto_objetivo, registros_stock):
            """
            Determina si el monto se puede formar exactamente con las denominaciones disponibles
            y el stock limitado de cada una.
            """
            if monto_objetivo < 0:
                return False
            # Solo es posible formar montos enteros con denominaciones enteras
            if monto_objetivo != monto_objetivo.to_integral_value():
                return False

            monto_int = int(monto_objetivo)

            # Construir lista de (denominacion, cantidad disponible) filtrando stocks positivos
            disponibles = [
                (int(reg.denominacion.denominacion), int(reg.stock))
                for reg in registros_stock
                if reg.stock > 0 and reg.denominacion.denominacion > 0
            ]

            if not disponibles:
                return False

            if monto_int == 0:
                return True

            # Programación dinámica con conjuntos para considerar stock limitado
            alcanzables = {0}
            for valor, cantidad in sorted(disponibles, key=lambda x: x[0], reverse=True):
                nuevos_alcanzables = set(alcanzables)
                for parcial in alcanzables:
                    max_utilizar = min(cantidad, (monto_int - parcial) // valor)
                    for n in range(1, max_utilizar + 1):
                        nuevos_alcanzables.add(parcial + n * valor)
                alcanzables = nuevos_alcanzables
                if monto_int in alcanzables:
                    return True

            return monto_int in alcanzables

        # Recorrer cada tauser y evaluar si tiene stock suficiente
        for tauser in tausers_activos:
            # Consultar registros de stock del tauser para la divisa específica
            registros_stock = StockDivisaTauser.objects.filter(
                tauser=tauser,
                denominacion__divisa_id=divisa_id,
                stock__gt=0
            ).select_related('denominacion')

            if puede_cubrir_monto(monto, registros_stock):
                tausers_con_stock_suficiente.append(tauser)

        # Ordenar por código
        tausers_con_stock_suficiente.sort(key=lambda t: t.codigo)

        serializer = TauserSerializer(tausers_con_stock_suficiente, many=True)
        return Response(serializer.data)
