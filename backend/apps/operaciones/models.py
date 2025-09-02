from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.clientes.models import Cliente

class MetodoFinanciero(models.Model):
    TIPO_CHOICES = [('cobro', 'Cobro'), ('pago', 'Pago')]
    nombre = models.CharField(max_length=50)   # Ej: Transferencia bancaria
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    comision = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)


# Métodos de la casa (con sus cuentas / wallets para cobrar)
class MetodoCobroCasa(models.Model):
    metodo = models.ForeignKey(MetodoFinanciero, on_delete=models.CASCADE)
    descripcion = models.CharField(max_length=100, blank=True)  # Ej: Banco Itaú
    nro_cuenta = models.CharField(max_length=50, blank=True)
    alias_wallet = models.CharField(max_length=50, blank=True)


# Métodos de pago asociados al cliente
class MetodoPagoCliente(models.Model):
    cliente = models.ForeignKey("Cliente", on_delete=models.CASCADE)
    metodo = models.ForeignKey(MetodoFinanciero, on_delete=models.CASCADE)
    nro_cuenta = models.CharField(max_length=50, blank=True)
    alias_wallet = models.CharField(max_length=50, blank=True)
    activo = models.BooleanField(default=True)


# Caso especial: Cheques
class Cheque(models.Model):
    cliente = models.ForeignKey("Cliente", on_delete=models.CASCADE)
    divisa = models.ForeignKey("Divisa", on_delete=models.CASCADE)
    numero = models.CharField(max_length=50, unique=True)
    tipo = models.CharField(max_length=15, choices=[('normal', 'Normal'), ('adelantado', 'Adelantado')])
    monto = models.DecimalField(max_digits=18, decimal_places=2)
    estado = models.CharField(max_length=15, choices=[('pendiente','Pendiente'),('aceptado','Aceptado'),('rechazado','Rechazado')])
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)

# Modelos específicos para cada tipo de método
class MetodoStripe(models.Model):
    cliente = models.ForeignKey("Cliente", on_delete=models.CASCADE)
    stripe_payment_method_id = models.CharField(max_length=100)  # ej. pm_XXXX
    brand = models.CharField(max_length=50)  # Visa, Mastercard...
    last4 = models.CharField(max_length=4)   # Últimos 4 dígitos
    exp_month = models.IntegerField()
    exp_year = models.IntegerField()
    activo = models.BooleanField(default=True)

class BilleteraDigital(models.Model):
    """Detalles específicos de billetera digital"""
    plataforma = models.CharField(max_length=50)  # PayPal, Nequi, etc.
    usuario_id = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return f"{self.plataforma} - {self.usuario_id}"

# Tabla intermedia para métodos de pago de clientes
class MetodoPagoCliente(models.Model):
    """Métodos de pago registrados por cada cliente"""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    metodo_financiero = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    
    # Referencia genérica a los detalles específicos
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    detalles = GenericForeignKey('content_type', 'object_id')
    
    alias = models.CharField(max_length=50, help_text="Nombre que el cliente da a este método")
    is_active = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['cliente', 'alias']
    
    def __str__(self):
        return f"{self.cliente} - {self.alias}"

# Métodos de cobro de la casa de cambio
class MetodoCobroCasaCambio(models.Model):
    """Métodos con los que la casa de cambio puede cobrar/pagar"""
    metodo_financiero = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    
    # Referencia genérica a los detalles específicos
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    detalles = GenericForeignKey('content_type', 'object_id')
    
    nombre_interno = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Casa Cambio - {self.nombre_interno}"