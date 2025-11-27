"""
Módulo de modelos para la gestión de ganancias del negocio.

Define el modelo Ganancia que registra y analiza las ganancias generadas
por cada transacción completada en el sistema GlobalExchange.
"""
from django.db import models
from apps.operaciones.models import Transaccion
from apps.divisas.models import Divisa
from apps.metodos_financieros.models import MetodoFinanciero


class PermisosGanancia(models.Model):
    """
    Modelo simbólico para asociar permisos de visualización de ganancias.

    Solo usuarios con rol admin/gerente pueden ver reportes de ganancias.
    """
    class Meta:
        default_permissions = ()
        permissions = [
            ("can_view_ganancias", "Puede ver reportes de ganancias"),
        ]


class Ganancia(models.Model):
    """
    Modelo que representa las ganancias generadas por una transacción.

    Registra el desglose completo de la ganancia obtenida por la casa de cambio
    en cada operación completada, permitiendo análisis por divisa, método de pago,
    tipo de operación y periodo temporal.

    Atributos:
        transaccion (OneToOne): Relación uno a uno con la transacción que generó la ganancia.
        ganancia_neta (Decimal): Ganancia total por operación.
        divisa_extranjera (FK): Divisa extranjera involucrada en la operación.
        fecha (Date): Fecha de la operación (sin hora, para agrupaciones).
        anio (int): Año de la operación (índice para consultas rápidas).
        mes (int): Mes de la operación (1-12, índice para consultas rápidas).
        operacion (str): Tipo de operación desde perspectiva de la casa (compra/venta).
        metodo_financiero (FK): Método de pago utilizado en la transacción.
        tasa_mercado (Decimal): Tasa base del mercado al momento de la operación.
        tasa_aplicada (Decimal): Tasa final aplicada al cliente.
        monto_divisa (Decimal): Monto en divisa extranjera de la operación.
        created_at (DateTime): Fecha y hora de creación del registro.
    """

    # Relación con la transacción
    transaccion = models.OneToOneField(
        Transaccion,
        on_delete=models.CASCADE,
        related_name='ganancia',
        verbose_name='Transacción'
    )

    ganancia_neta = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text='Ganancia neta por la operación'
    )

    # Campos para análisis y filtros
    divisa_extranjera = models.ForeignKey(
        Divisa,
        on_delete=models.CASCADE,
        related_name='ganancias',
        verbose_name='Divisa Extranjera'
    )
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha',
        help_text='Fecha de la operación (sin hora)'
    )
    anio = models.IntegerField(
        db_index=True,
        verbose_name='Año',
        help_text='Año de la operación'
    )
    mes = models.IntegerField(
        db_index=True,
        verbose_name='Mes',
        help_text='Mes de la operación (1-12)'
    )
    operacion = models.CharField(
        max_length=10,
        choices=[('compra', 'Compra'), ('venta', 'Venta')],
        db_index=True,
        verbose_name='Tipo de Operación',
        help_text='Tipo de operación desde perspectiva de la casa'
    )
    metodo_financiero = models.ForeignKey(
        MetodoFinanciero,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ganancias',
        verbose_name='Método Financiero'
    )

    # Contexto de la operación
    tasa_mercado = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        verbose_name='Tasa de Mercado',
        help_text='Tasa base (precioBase) al momento de la operación'
    )
    tasa_aplicada = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        verbose_name='Tasa Aplicada',
        help_text='Tasa final aplicada al cliente'
    )
    monto_divisa = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name='Monto en Divisa',
        help_text='Monto en divisa extranjera de la operación'
    )

    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    class Meta:
        verbose_name = 'Ganancia'
        verbose_name_plural = 'Ganancias'
        ordering = ['-fecha', '-created_at']

        # Índices compuestos para optimizar consultas comunes
        indexes = [
            models.Index(fields=['fecha', 'divisa_extranjera'],
                         name='idx_fecha_divisa'),
            models.Index(fields=['anio', 'mes'], name='idx_anio_mes'),
            models.Index(fields=['metodo_financiero',
                         'fecha'], name='idx_metodo_fecha'),
            models.Index(fields=['operacion', 'fecha'],
                         name='idx_operacion_fecha'),
            models.Index(
                fields=['divisa_extranjera', 'operacion', 'fecha'], name='idx_div_op_fecha'),
        ]

    def __str__(self):
        return f"Ganancia {self.transaccion.id} - {self.divisa_extranjera.codigo} - {self.fecha} - {self.ganancia_neta}"

    @property
    def porcentaje_margen(self):
        """Calcula el porcentaje de margen sobre la tasa de mercado."""
        if self.tasa_mercado and self.tasa_mercado != 0:
            margen = abs(self.tasa_aplicada - self.tasa_mercado)
            return (margen / self.tasa_mercado) * 100
        return 0

    @property
    def ganancia_por_unidad(self):
        """Calcula la ganancia por unidad de divisa."""
        if self.monto_divisa and self.monto_divisa != 0:
            return self.ganancia_neta / self.monto_divisa
        return 0
