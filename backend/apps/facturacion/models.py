from django.db import models
from django.core.exceptions import ValidationError
from solo.models import SingletonModel
from apps.operaciones.models import Transaccion

class Factura(models.Model):
    ESTADO_CHOICES = [
        ("APROBADO", "Aprobado"),
        ("RECHAZADO", "Rechazado"),
        ("EN_PROCESO", "En proceso"),
    ]

    transaccion = models.ForeignKey(Transaccion, on_delete=models.PROTECT)
    cdc = models.CharField(max_length=50)
    estado = models.CharField(max_length=100, choices=ESTADO_CHOICES, default="EN_PROCESO")

class FacturaSettings(SingletonModel):
    ultimo_num = models.IntegerField(default=214)
    last_updated = models.DateTimeField(auto_now=True)
    rango_inicio = models.IntegerField(default=201)
    rango_fin = models.IntegerField(default=250)

    def siguiente_num(self):
        if self.ultimo_num >= self.rango_fin:
            raise ValidationError("Se ha alcanzado el limite de facturacion")
    
        return self.ultimo_num + 1
