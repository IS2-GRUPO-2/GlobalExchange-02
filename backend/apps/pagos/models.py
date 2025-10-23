from django.db import models
from apps.metodos_financieros.models import MetodoFinanciero


# Create your models here.
class Pagos(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("APROBADO", "Aprobado"),
        ("FALLIDO", "Fallido"),
    ]

    metodo_pago = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    request = models.CharField(max_length=255, null=True, blank=True)
    response = models.CharField(max_length=255, null=True, blank=True)
    estado = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    