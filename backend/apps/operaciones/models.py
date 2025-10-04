from django.db import models
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa
from apps.usuarios.models import User 
from apps.tauser.models import Tauser
from apps.financiero.models import MetodoFinanciero, MetodoFinancieroDetalle

class PermisosOperacion(models.Model):
    """
    Modelo simbólico para asociar permisos de simulación.

    Nota:
    - No se persisten simulaciones en la base de datos.
    - Sirve para registrar permisos personalizados en la UI.
    """
    class Meta:
        default_permissions = ()
        permissions = [
            ("can_use_operacion", "Puede realizar operaciones de compra y venta"),
        ]


class Transaccion(models.Model):
    OPERACION_CHOICES = [
        ('compra', 'Compra'),
        ('venta', 'Venta'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
        ('fallida', 'Fallida'),
    ]
    
    operador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transacciones_operadas')
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='transacciones')
    operacion = models.CharField(max_length=10, choices=OPERACION_CHOICES)
    tasa_aplicada = models.DecimalField(max_digits=15, decimal_places=6)
    tasa_inicial = models.DecimalField(max_digits=15, decimal_places=6)
    divisa_origen = models.ForeignKey(Divisa, on_delete=models.CASCADE, related_name='transacciones_origen')
    divisa_destino = models.ForeignKey(Divisa, on_delete=models.CASCADE, related_name='transacciones_destino')
    monto_origen = models.DecimalField(max_digits=15, decimal_places=2)
    monto_destino = models.DecimalField(max_digits=15, decimal_places=2)
    metodo_financiero = models.ForeignKey(MetodoFinanciero, on_delete=models.SET_NULL, null=True, blank=True)
    metodo_financiero_detalle = models.ForeignKey(MetodoFinancieroDetalle, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    tauser = models.ForeignKey(Tauser, on_delete=models.CASCADE, related_name='transacciones')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.operacion.title()} - {self.cliente} - {self.estado}"
    
    class Meta:
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        ordering = ['-created_at']
