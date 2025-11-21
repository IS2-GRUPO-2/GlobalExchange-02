"""
Configuración del Django Admin para ganancias.
"""
from django.contrib import admin
from .models import Ganancia


@admin.register(Ganancia)
class GananciaAdmin(admin.ModelAdmin):
    """
    Configuración del admin para el modelo Ganancia.

    Proporciona interfaz de administración con filtros avanzados
    y visualización optimizada de datos.
    """

    list_display = [
        'id',
        'fecha',
        'divisa_extranjera',
        'operacion',
        'ganancia_neta',
        'monto_divisa',
        'tasa_aplicada',
        'metodo_financiero',
        'transaccion_link',
    ]

    list_filter = [
        'operacion',
        'divisa_extranjera',
        'metodo_financiero',
        'anio',
        'mes',
        'fecha',
    ]

    search_fields = [
        'transaccion__id',
        'transaccion__cliente__nombre',
        'divisa_extranjera__codigo',
        'divisa_extranjera__nombre',
    ]

    readonly_fields = [
        'transaccion',
        'ganancia_neta',
        'ganancia_margen_tasa',
        'ganancia_comision_metodo',
        'descuento_categoria',
        'divisa_extranjera',
        'fecha',
        'anio',
        'mes',
        'operacion',
        'metodo_financiero',
        'tasa_mercado',
        'tasa_aplicada',
        'monto_divisa',
        'created_at',
        'porcentaje_margen',
        'ganancia_por_unidad',
    ]

    fieldsets = (
        ('Información General', {
            'fields': ('transaccion', 'fecha', 'operacion', 'divisa_extranjera', 'metodo_financiero')
        }),
        ('Ganancias Desglosadas', {
            'fields': ('ganancia_neta', 'ganancia_margen_tasa', 'ganancia_comision_metodo', 'descuento_categoria')
        }),
        ('Datos de la Operación', {
            'fields': ('tasa_mercado', 'tasa_aplicada', 'monto_divisa')
        }),
        ('Métricas Calculadas', {
            'fields': ('porcentaje_margen', 'ganancia_por_unidad')
        }),
        ('Clasificación Temporal', {
            'fields': ('anio', 'mes')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )

    date_hierarchy = 'fecha'
    ordering = ['-fecha', '-created_at']

    def transaccion_link(self, obj):
        """Link a la transacción relacionada."""
        from django.urls import reverse
        from django.utils.html import format_html

        url = reverse('admin:operaciones_transaccion_change',
                      args=[obj.transaccion.id])
        return format_html('<a href="{}">{}</a>', url, f'Transacción #{obj.transaccion.id}')

    transaccion_link.short_description = 'Transacción'

    def has_add_permission(self, request):
        """No permitir creación manual de ganancias."""
        return False

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminación manual de ganancias."""
        return False
