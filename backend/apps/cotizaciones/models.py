"""
Módulo de modelos para la gestión de tasas de divisas.

Define los modelos relacionados con el registro de tasas base
y su historial de cambios en el sistema GlobalExchange.
"""
from django.db import models
from apps.divisas.models import Divisa


class Tasa(models.Model):
    """
    Modelo que representa la tasa base asociada a una divisa.
    
    Atributos:
        divisa (OneToOne): Relación uno a uno con la divisa correspondiente.
        precioBase (Decimal): Precio base de la divisa.
        comisionBaseCompra (Decimal): Comisión base aplicada en operaciones de compra.
        comisionBaseVenta (Decimal): Comisión base aplicada en operaciones de venta.
        activo (bool): Indica si la tasa está activa.
        fechaCreacion (datetime): Fecha de creación del registro.
        fechaActualizacion (datetime): Última fecha de actualización.
    """
    divisa = models.OneToOneField(Divisa, on_delete=models.CASCADE, related_name="tasa")

    precioBase = models.DecimalField(max_digits=30, decimal_places=10)
    comisionBaseCompra = models.DecimalField(max_digits=30, decimal_places=10, default=0)
    comisionBaseVenta = models.DecimalField(max_digits=30, decimal_places=10, default=0)

    activo = models.BooleanField(default=True)
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    fechaActualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Retorna una representación legible de la tasa con divisa y precio base."""
        return f"Tasa {self.divisa.codigo} (base={self.precioBase})"


class HistorialTasa(models.Model):
    """
    Modelo que almacena los registros históricos de variación de una tasa.
    
    Atributos:
        tasa (ForeignKey): Referencia a la tasa a la que pertenece el historial.
        fechaCreacion (datetime): Fecha de creación del registro histórico.
        tasaCompra (Decimal): Valor de tasa de compra en el momento del registro.
        tasaVenta (Decimal): Valor de tasa de venta en el momento del registro.
    """
    tasa = models.ForeignKey(Tasa, on_delete=models.CASCADE, related_name="historiales")

    fechaCreacion = models.DateTimeField(auto_now_add=True)

    tasaCompra = models.DecimalField(max_digits=30, decimal_places=10)
    tasaVenta = models.DecimalField(max_digits=30, decimal_places=10)

    def __str__(self):
        """Retorna una representación legible del historial con divisa y fecha."""
        return f"Historial {self.tasa.divisa.codigo} - {self.fechaCreacion:%Y-%m-%d %H:%M}"
    