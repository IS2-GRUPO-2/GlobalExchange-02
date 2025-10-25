from django.db import models
from apps.metodos_financieros.models import MetodoFinanciero
from apps.operaciones.models import Transaccion
from simple_history.models import HistoricalRecords
# Create your models here.
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
        """
        Valida que no exista un pago pendiente o aprobado para la transacción.
        """
        from django.core.exceptions import ValidationError
        
        # Verificar si ya existe un pago pendiente o aprobado para esta transacción
        existing_payment = Pagos.objects.filter(
            transaccion=self.transaccion,
            estado__in=["PENDIENTE", "APROBADO"]
        ).exclude(pk=self.pk).exists()  # Excluimos el pago actual en caso de actualización
        
        if existing_payment:
            raise ValidationError(
                "Ya existe un pago pendiente o aprobado para esta transacción. "
                "No se puede crear un nuevo pago hasta que el pago existente sea marcado como fallido."
            )

    def save(self, *args, **kwargs):
        """
        Sobrescribe el método save para asegurar que se ejecuten las validaciones.
        """
        self.clean()
        super().save(*args, **kwargs)
    