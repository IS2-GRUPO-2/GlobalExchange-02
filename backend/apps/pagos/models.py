from django.db import models
from apps.metodos_financieros.models import MetodoFinanciero
from apps.operaciones.models import Transaccion
from simple_history.models import HistoricalRecords


class Pagos(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("APROBADO", "Aprobado"),
        ("FALLIDO", "Fallido"),
    ]
    transaccion = models.ForeignKey(Transaccion, on_delete=models.PROTECT)
    metodo_pago = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    request = models.CharField(max_length=255, null=True, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=100, null=True, blank=True)
    response = models.CharField(max_length=255, null=True, blank=True)
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default="PENDIENTE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def clean(self):
        """Evita pagos activos duplicados para la misma transacción y método."""
        from django.core.exceptions import ValidationError

        existing_payment = Pagos.objects.filter(
            transaccion=self.transaccion,
            metodo_pago=self.metodo_pago,
            estado__in=["PENDIENTE", "APROBADO"],
        ).exclude(pk=self.pk).exists()

        if existing_payment:
            raise ValidationError(
                "Ya existe un pago pendiente o aprobado para esta transacción con este métodos. "
                "No se puede crear un nuevo pago hasta que el pago existente sea marcado como fallido."
            )

    def save(self, *args, **kwargs):
        """Sobrescribe save para garantizar las validaciones previas."""
        self.clean()
        super().save(*args, **kwargs)
