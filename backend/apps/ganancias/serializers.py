"""
Serializers para la gestión de ganancias.

Define la representación JSON de los modelos de ganancias
y serializers especializados para reportes agregados.
"""
from rest_framework import serializers
from .models import Ganancia
from apps.divisas.serializers import DivisaSerializer
from apps.metodos_financieros.serializers import MetodoFinancieroSerializer


class GananciaSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Ganancia.

    Incluye campos relacionados con información detallada de:
    - Divisa extranjera
    - Método financiero
    - Propiedades calculadas (porcentaje_margen, ganancia_por_unidad)
    """

    divisa_extranjera_detalle = DivisaSerializer(
        source='divisa_extranjera',
        read_only=True
    )
    metodo_financiero_detalle = MetodoFinancieroSerializer(
        source='metodo_financiero',
        read_only=True
    )
    porcentaje_margen = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    ganancia_por_unidad = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )

    # Información básica de la transacción
    transaccion_id = serializers.IntegerField(
        source='transaccion.id', read_only=True)
    cliente_nombre = serializers.CharField(
        source='transaccion.cliente.nombre', read_only=True)

    class Meta:
        model = Ganancia
        fields = [
            'id',
            'transaccion',
            'transaccion_id',
            'cliente_nombre',
            'ganancia_neta',
            'ganancia_margen_tasa',
            'ganancia_comision_metodo',
            'descuento_categoria',
            'divisa_extranjera',
            'divisa_extranjera_detalle',
            'fecha',
            'anio',
            'mes',
            'operacion',
            'metodo_financiero',
            'metodo_financiero_detalle',
            'tasa_mercado',
            'tasa_aplicada',
            'monto_divisa',
            'porcentaje_margen',
            'ganancia_por_unidad',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class GananciaResumenSerializer(serializers.Serializer):
    """
    Serializer para resumen de ganancias sin campos de modelo.

    Usado para reportes agregados que no corresponden a una instancia específica.
    """

    total_ganancia = serializers.DecimalField(max_digits=15, decimal_places=2)
    cantidad_operaciones = serializers.IntegerField()
    ganancia_promedio = serializers.DecimalField(
        max_digits=15, decimal_places=2)
    ganancia_maxima = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False)
    ganancia_minima = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False)


class GananciaPorDivisaSerializer(serializers.Serializer):
    """Serializer para reporte de ganancias agrupadas por divisa."""

    divisa_codigo = serializers.CharField()
    divisa_nombre = serializers.CharField()
    total_ganancia = serializers.DecimalField(max_digits=15, decimal_places=2)
    cantidad_operaciones = serializers.IntegerField()
    ganancia_promedio = serializers.DecimalField(
        max_digits=15, decimal_places=2)
    monto_total_operado = serializers.DecimalField(
        max_digits=15, decimal_places=2)


class GananciaPorMetodoSerializer(serializers.Serializer):
    """Serializer para reporte de ganancias agrupadas por método de pago."""

    metodo_nombre = serializers.CharField()
    metodo_display = serializers.CharField()
    total_ganancia = serializers.DecimalField(max_digits=15, decimal_places=2)
    cantidad_operaciones = serializers.IntegerField()
    ganancia_promedio = serializers.DecimalField(
        max_digits=15, decimal_places=2)


class GananciaEvolucionTemporalSerializer(serializers.Serializer):
    """Serializer para reporte de evolución temporal de ganancias."""

    periodo = serializers.CharField()  # "2024-01", "2024-02", etc.
    anio = serializers.IntegerField()
    mes = serializers.IntegerField()
    total_ganancia = serializers.DecimalField(max_digits=15, decimal_places=2)
    cantidad_operaciones = serializers.IntegerField()
    ganancia_promedio = serializers.DecimalField(
        max_digits=15, decimal_places=2)


class GananciaTopTransaccionesSerializer(serializers.Serializer):
    """Serializer para reporte de transacciones con mayor ganancia."""

    transaccion_id = serializers.IntegerField()
    fecha = serializers.DateField()
    divisa_codigo = serializers.CharField()
    operacion = serializers.CharField()
    ganancia_neta = serializers.DecimalField(max_digits=15, decimal_places=2)
    monto_divisa = serializers.DecimalField(max_digits=15, decimal_places=2)
    tasa_aplicada = serializers.DecimalField(max_digits=15, decimal_places=6)
    cliente_nombre = serializers.CharField()
    metodo_nombre = serializers.CharField(allow_null=True)


class EstadisticasGeneralesSerializer(serializers.Serializer):
    """Serializer para estadísticas generales del periodo."""

    total_ganancia = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_operaciones = serializers.IntegerField()
    ganancia_promedio_operacion = serializers.DecimalField(
        max_digits=15, decimal_places=2)
    ganancia_maxima = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True)
    ganancia_minima = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True)
    operaciones_compra = serializers.IntegerField()
    operaciones_venta = serializers.IntegerField()
    ganancia_compra = serializers.DecimalField(max_digits=15, decimal_places=2)
    ganancia_venta = serializers.DecimalField(max_digits=15, decimal_places=2)
    fecha_inicio = serializers.DateField(allow_null=True)
    fecha_fin = serializers.DateField(allow_null=True)
