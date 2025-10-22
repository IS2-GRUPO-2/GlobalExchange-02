from django.db import models
from django.core.exceptions import ValidationError
from solo.models import SingletonModel
from apps.operaciones.models import Transaccion

class Factura(models.Model):
    transaccion = models.ForeignKey(Transaccion, on_delete=models.PROTECT)
    pdf_url = models.CharField(max_length=200, )

class FacturaSettings(SingletonModel):
    ultimo_num = models.IntegerField(default=201)
    last_updated = models.DateTimeField(auto_now=True)
    rango_inicio = models.IntegerField(default=201)
    rango_fin = models.IntegerField(default=250)

    def siguiente_num(self):
        if self.ultimo_num >= self.rango_fin:
            raise ValidationError("Se ha alcanzado el limite de facturacion")
    
        return self.ultimo_num + 1
