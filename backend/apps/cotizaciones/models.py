from django.db import models
from apps.divisas.models import Divisa


class Tasa(models.Model):
    divisa = models.OneToOneField(Divisa, on_delete=models.CASCADE, related_name="tasa")

    precioBase = models.DecimalField(max_digits=30, decimal_places=10)
    comisionBase = models.DecimalField(max_digits=30, decimal_places=10, default=0)

    activo = models.BooleanField(default=True)
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    fechaActualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tasa {self.divisa.codigo} (base={self.precioBase})"


class HistorialTasa(models.Model):
    tasa = models.ForeignKey(Tasa, on_delete=models.CASCADE, related_name="historiales")

    fechaCreacion = models.DateTimeField(auto_now_add=True)

    tasaCompra = models.DecimalField(max_digits=30, decimal_places=10)
    tasaVenta = models.DecimalField(max_digits=30, decimal_places=10)

    def __str__(self):
        return f"Historial {self.tasa.divisa.codigo} - {self.fechaCreacion:%Y-%m-%d %H:%M}"
    