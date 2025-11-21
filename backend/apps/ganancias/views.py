"""
Vistas para la gestión de reportes de ganancias.

Proporciona ViewSet de solo lectura con múltiples endpoints
para consultar y analizar ganancias del negocio.
"""
from decimal import Decimal
from django.db.models import Sum, Avg, Max, Min, Count, F
from django.utils.dateparse import parse_date
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Ganancia
from .serializers import (
    GananciaSerializer,
    GananciaResumenSerializer,
    GananciaPorDivisaSerializer,
    GananciaPorMetodoSerializer,
    GananciaEvolucionTemporalSerializer,
    GananciaTopTransaccionesSerializer,
    EstadisticasGeneralesSerializer,
)


class GananciaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para consultar ganancias.

    Permisos: Solo usuarios autenticados con permiso 'can_view_ganancias'
    (admin/gerente) pueden acceder a estos endpoints.

    Endpoints disponibles:
    - GET /api/ganancias/ - Listar todas las ganancias
    - GET /api/ganancias/{id}/ - Detalle de una ganancia específica
    - GET /api/ganancias/reporte_general/ - Resumen general de ganancias
    - GET /api/ganancias/por_divisa/ - Ganancias agrupadas por divisa
    - GET /api/ganancias/por_metodo/ - Ganancias agrupadas por método de pago
    - GET /api/ganancias/evolucion_temporal/ - Evolución mensual de ganancias
    - GET /api/ganancias/top_transacciones/ - Transacciones con mayor ganancia
    - GET /api/ganancias/estadisticas/ - Estadísticas generales del periodo
    - GET /api/ganancias/comparativa_operaciones/ - Comparativa compra vs venta
    """

    queryset = Ganancia.objects.select_related(
        'divisa_extranjera',
        'metodo_financiero',
        'transaccion',
        'transaccion__cliente'
    ).all()
    serializer_class = GananciaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Filtros disponibles
    filterset_fields = ['divisa_extranjera',
                        'operacion', 'metodo_financiero', 'anio', 'mes']
    ordering_fields = ['fecha', 'ganancia_neta', 'monto_divisa', 'created_at']
    ordering = ['-fecha', '-created_at']

    def get_queryset(self):
        """
        Filtra el queryset base por rango de fechas si se especifican.

        Query params:
        - fecha_inicio: Fecha de inicio (YYYY-MM-DD)
        - fecha_fin: Fecha de fin (YYYY-MM-DD)
        """
        queryset = super().get_queryset()

        # Filtros por fecha
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')

        if fecha_inicio:
            fecha_inicio = parse_date(fecha_inicio)
            if fecha_inicio:
                queryset = queryset.filter(fecha__gte=fecha_inicio)

        if fecha_fin:
            fecha_fin = parse_date(fecha_fin)
            if fecha_fin:
                queryset = queryset.filter(fecha__lte=fecha_fin)

        return queryset

    @action(detail=False, methods=['get'])
    def reporte_general(self, request):
        """
        GET /api/ganancias/reporte_general/

        Retorna un resumen general de ganancias en el periodo especificado.

        Query params:
        - fecha_inicio: Fecha de inicio (opcional)
        - fecha_fin: Fecha de fin (opcional)

        Response:
        {
            "total_ganancia": "1500000.00",
            "cantidad_operaciones": 150,
            "ganancia_promedio": "10000.00",
            "ganancia_maxima": "50000.00",
            "ganancia_minima": "1000.00"
        }
        """
        queryset = self.filter_queryset(self.get_queryset())

        stats = queryset.aggregate(
            total_ganancia=Sum('ganancia_neta'),
            cantidad_operaciones=Count('id'),
            ganancia_promedio=Avg('ganancia_neta'),
            ganancia_maxima=Max('ganancia_neta'),
            ganancia_minima=Min('ganancia_neta'),
        )

        # Convertir None a 0 para campos numéricos
        stats['total_ganancia'] = stats['total_ganancia'] or Decimal('0')
        stats['ganancia_promedio'] = stats['ganancia_promedio'] or Decimal('0')
        stats['cantidad_operaciones'] = stats['cantidad_operaciones'] or 0

        serializer = GananciaResumenSerializer(data=stats)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_divisa(self, request):
        """
        GET /api/ganancias/por_divisa/

        Retorna ganancias agrupadas por divisa extranjera.

        Response:
        [
            {
                "divisa_codigo": "USD",
                "divisa_nombre": "Dólar Estadounidense",
                "total_ganancia": "800000.00",
                "cantidad_operaciones": 80,
                "ganancia_promedio": "10000.00",
                "monto_total_operado": "50000.00"
            },
            ...
        ]
        """
        queryset = self.filter_queryset(self.get_queryset())

        ganancias_por_divisa = queryset.values(
            divisa_codigo=F('divisa_extranjera__codigo'),
            divisa_nombre=F('divisa_extranjera__nombre')
        ).annotate(
            total_ganancia=Sum('ganancia_neta'),
            cantidad_operaciones=Count('id'),
            ganancia_promedio=Avg('ganancia_neta'),
            monto_total_operado=Sum('monto_divisa'),
        ).order_by('-total_ganancia')

        serializer = GananciaPorDivisaSerializer(
            ganancias_por_divisa, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_metodo(self, request):
        """
        GET /api/ganancias/por_metodo/

        Retorna ganancias agrupadas por método de pago.

        Response:
        [
            {
                "metodo_nombre": "EFECTIVO",
                "metodo_display": "Efectivo",
                "total_ganancia": "600000.00",
                "cantidad_operaciones": 100,
                "ganancia_promedio": "6000.00"
            },
            ...
        ]
        """
        queryset = self.filter_queryset(self.get_queryset())

        ganancias_por_metodo = queryset.values(
            metodo_nombre=F('metodo_financiero__nombre'),
            # TODO: usar get_nombre_display
            metodo_display=F('metodo_financiero__nombre')
        ).annotate(
            total_ganancia=Sum('ganancia_neta'),
            cantidad_operaciones=Count('id'),
            ganancia_promedio=Avg('ganancia_neta'),
        ).order_by('-total_ganancia')

        # Manejar casos donde metodo_financiero es null
        for item in ganancias_por_metodo:
            if item['metodo_nombre'] is None:
                item['metodo_nombre'] = 'SIN_METODO'
                item['metodo_display'] = 'Sin método especificado'

        serializer = GananciaPorMetodoSerializer(
            ganancias_por_metodo, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def evolucion_temporal(self, request):
        """
        GET /api/ganancias/evolucion_temporal/

        Retorna evolución temporal de ganancias agrupadas por mes.

        Query params:
        - granularidad: 'mes' (default) o 'dia'

        Response:
        [
            {
                "periodo": "2024-01",
                "anio": 2024,
                "mes": 1,
                "total_ganancia": "150000.00",
                "cantidad_operaciones": 25,
                "ganancia_promedio": "6000.00"
            },
            ...
        ]
        """
        queryset = self.filter_queryset(self.get_queryset())
        granularidad = request.query_params.get('granularidad', 'mes')

        if granularidad == 'dia':
            # Agrupar por día
            evolucion = queryset.values('fecha').annotate(
                total_ganancia=Sum('ganancia_neta'),
                cantidad_operaciones=Count('id'),
                ganancia_promedio=Avg('ganancia_neta'),
            ).order_by('fecha')

            # Formatear respuesta
            data = [
                {
                    'periodo': item['fecha'].strftime('%Y-%m-%d'),
                    'anio': item['fecha'].year,
                    'mes': item['fecha'].month,
                    'total_ganancia': item['total_ganancia'],
                    'cantidad_operaciones': item['cantidad_operaciones'],
                    'ganancia_promedio': item['ganancia_promedio'],
                }
                for item in evolucion
            ]
        else:
            # Agrupar por mes (default)
            evolucion = queryset.values('anio', 'mes').annotate(
                total_ganancia=Sum('ganancia_neta'),
                cantidad_operaciones=Count('id'),
                ganancia_promedio=Avg('ganancia_neta'),
            ).order_by('anio', 'mes')

            # Formatear respuesta
            data = [
                {
                    'periodo': f"{item['anio']}-{item['mes']:02d}",
                    'anio': item['anio'],
                    'mes': item['mes'],
                    'total_ganancia': item['total_ganancia'],
                    'cantidad_operaciones': item['cantidad_operaciones'],
                    'ganancia_promedio': item['ganancia_promedio'],
                }
                for item in evolucion
            ]

        serializer = GananciaEvolucionTemporalSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_transacciones(self, request):
        """
        GET /api/ganancias/top_transacciones/

        Retorna las transacciones con mayor ganancia.

        Query params:
        - limit: Cantidad de resultados (default: 10, max: 100)

        Response:
        [
            {
                "transaccion_id": 123,
                "fecha": "2024-01-15",
                "divisa_codigo": "USD",
                "operacion": "venta",
                "ganancia_neta": "25000.00",
                "monto_divisa": "500.00",
                "tasa_aplicada": "7500.00",
                "cliente_nombre": "Juan Pérez",
                "metodo_nombre": "EFECTIVO"
            },
            ...
        ]
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Obtener límite de resultados
        try:
            limit = int(request.query_params.get('limit', 10))
            limit = min(limit, 100)  # Máximo 100 resultados
        except ValueError:
            limit = 10

        top = queryset.order_by('-ganancia_neta')[:limit]

        data = [
            {
                'transaccion_id': g.transaccion.id,
                'fecha': g.fecha,
                'divisa_codigo': g.divisa_extranjera.codigo,
                'operacion': g.operacion,
                'ganancia_neta': g.ganancia_neta,
                'monto_divisa': g.monto_divisa,
                'tasa_aplicada': g.tasa_aplicada,
                'cliente_nombre': g.transaccion.cliente.nombre,
                'metodo_nombre': g.metodo_financiero.nombre if g.metodo_financiero else None,
            }
            for g in top
        ]

        serializer = GananciaTopTransaccionesSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        GET /api/ganancias/estadisticas/

        Retorna estadísticas generales completas del periodo.

        Response:
        {
            "total_ganancia": "1500000.00",
            "total_operaciones": 150,
            "ganancia_promedio_operacion": "10000.00",
            "ganancia_maxima": "50000.00",
            "ganancia_minima": "1000.00",
            "operaciones_compra": 80,
            "operaciones_venta": 70,
            "ganancia_compra": "600000.00",
            "ganancia_venta": "900000.00",
            "fecha_inicio": "2024-01-01",
            "fecha_fin": "2024-12-31"
        }
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Estadísticas generales
        stats_generales = queryset.aggregate(
            total_ganancia=Sum('ganancia_neta'),
            total_operaciones=Count('id'),
            ganancia_promedio_operacion=Avg('ganancia_neta'),
            ganancia_maxima=Max('ganancia_neta'),
            ganancia_minima=Min('ganancia_neta'),
        )

        # Estadísticas por tipo de operación
        stats_compra = queryset.filter(operacion='compra').aggregate(
            operaciones_compra=Count('id'),
            ganancia_compra=Sum('ganancia_neta'),
        )

        stats_venta = queryset.filter(operacion='venta').aggregate(
            operaciones_venta=Count('id'),
            ganancia_venta=Sum('ganancia_neta'),
        )

        # Rango de fechas
        fechas = queryset.aggregate(
            fecha_inicio=Min('fecha'),
            fecha_fin=Max('fecha'),
        )

        # Combinar datos
        data = {
            **stats_generales,
            **stats_compra,
            **stats_venta,
            **fechas,
        }

        # Valores por defecto
        data['total_ganancia'] = data['total_ganancia'] or Decimal('0')
        data['ganancia_promedio_operacion'] = data['ganancia_promedio_operacion'] or Decimal(
            '0')
        data['total_operaciones'] = data['total_operaciones'] or 0
        data['operaciones_compra'] = data['operaciones_compra'] or 0
        data['operaciones_venta'] = data['operaciones_venta'] or 0
        data['ganancia_compra'] = data['ganancia_compra'] or Decimal('0')
        data['ganancia_venta'] = data['ganancia_venta'] or Decimal('0')

        serializer = EstadisticasGeneralesSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def comparativa_operaciones(self, request):
        """
        GET /api/ganancias/comparativa_operaciones/

        Retorna comparativa entre operaciones de compra y venta.

        Response:
        {
            "compra": {
                "total_ganancia": "600000.00",
                "cantidad_operaciones": 80,
                "ganancia_promedio": "7500.00",
                "porcentaje_total": 40
            },
            "venta": {
                "total_ganancia": "900000.00",
                "cantidad_operaciones": 70,
                "ganancia_promedio": "12857.14",
                "porcentaje_total": 60
            }
        }
        """
        queryset = self.filter_queryset(self.get_queryset())

        total_general = queryset.aggregate(total=Sum('ganancia_neta'))[
            'total'] or Decimal('0')

        compra = queryset.filter(operacion='compra').aggregate(
            total_ganancia=Sum('ganancia_neta'),
            cantidad_operaciones=Count('id'),
            ganancia_promedio=Avg('ganancia_neta'),
        )

        venta = queryset.filter(operacion='venta').aggregate(
            total_ganancia=Sum('ganancia_neta'),
            cantidad_operaciones=Count('id'),
            ganancia_promedio=Avg('ganancia_neta'),
        )

        # Calcular porcentajes
        compra['total_ganancia'] = compra['total_ganancia'] or Decimal('0')
        venta['total_ganancia'] = venta['total_ganancia'] or Decimal('0')

        if total_general > 0:
            compra['porcentaje_total'] = float(
                (compra['total_ganancia'] / total_general) * 100)
            venta['porcentaje_total'] = float(
                (venta['total_ganancia'] / total_general) * 100)
        else:
            compra['porcentaje_total'] = 0
            venta['porcentaje_total'] = 0

        return Response({
            'compra': compra,
            'venta': venta,
        })
