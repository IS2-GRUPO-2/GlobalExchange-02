from django.db import models
from apps.metodos_financieros.models import MetodoFinanciero
from apps.operaciones.models import Transaccion

# Create your models here.
class Pagos(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("APROBADO", "Aprobado"),
        ("FALLIDO", "Fallido"),
    ]
    transaccion = models.OneToOneField(Transaccion, on_delete=models.PROTECT)
    metodo_pago = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    request = models.CharField(max_length=255, null=True, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=100, null=True, blank=True)
    response = models.CharField(max_length=255, null=True, blank=True)
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default="PENDIENTE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    