from django.db import models
from django.core.exceptions import ValidationError
from apps.clientes.models import Cliente


# ======================== CATÁLOGOS INDEPENDIENTES ========================

class Banco(models.Model):
    """Catálogo de bancos disponibles"""
    nombre = models.CharField(max_length=100, unique=True, help_text="Nombre del banco (ej: Santander, Itaú, BBVA)")
    cvu = models.CharField(max_length=22, unique=True, help_text="CVU del banco para transferencias interbancarias")
    is_active = models.BooleanField(default=True, help_text="Indica si el banco está disponible")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Banco"
        verbose_name_plural = "Bancos"
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class BilleteraDigitalCatalogo(models.Model):
    """Catálogo de billeteras digitales disponibles"""
    nombre = models.CharField(max_length=100, unique=True, help_text="Nombre de la billetera (ej: PayPal, MercadoPago, Binance Pay, TigoMoney)")
    is_active = models.BooleanField(default=True, help_text="Indica si la billetera está disponible")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Catalogo  de Billetera Digital"
        verbose_name_plural = "Billeteras Digitales"
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class TipoMetodoFinanciero(models.TextChoices):
    """Tipos de métodos financieros"""
    TRANSFERENCIA_BANCARIA = 'TRANSFERENCIA_BANCARIA', 'Transferencia Bancaria'
    BILLETERA_DIGITAL = 'BILLETERA_DIGITAL', 'Billetera Digital'
    TARJETA = 'TARJETA', 'Tarjeta de Crédito/Débito'
    METALICO = 'METALICO', 'Metalico'
    CHEQUE = 'CHEQUE', 'Cheque'


class MetodoFinanciero(models.Model):
    """Catálogo central de métodos financieros"""
    nombre = models.CharField(max_length=50, choices=TipoMetodoFinanciero.choices, unique=True)
    
    # Capacidades del método (FLAGS)
    permite_cobro = models.BooleanField(default=True, help_text="Casa puede cobrar con este método")
    permite_pago = models.BooleanField(default=True, help_text="Casa puede pagar con este método")
    
    # Comisiones diferenciadas por tipo de operación
    comision_cobro_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    comision_pago_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Estado y trazabilidad
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Método Financiero"
        verbose_name_plural = "Métodos Financieros"
        ordering = ['nombre']
    
    def clean(self):
        """Validaciones del modelo"""
        # Validar rangos de comisiones
        for field, value in [
            ('comision_cobro_porcentaje', self.comision_cobro_porcentaje),
            ('comision_pago_porcentaje', self.comision_pago_porcentaje)
        ]:
            if value < 0 or value > 100:
                raise ValidationError(f"{field} debe estar entre 0 y 100")
    
    def __str__(self):
        return self.get_nombre_display()

    
# ======================== Tabla intermedia ========================

class MetodoFinancieroDetalle(models.Model):
    """Métodos financieros específicos registrados (cliente o casa de cambio)"""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, null=True, blank=True)
    es_cuenta_casa = models.BooleanField(default=False, help_text="Indica si es cuenta de la casa de cambio")
    
    metodo_financiero = models.ForeignKey(MetodoFinanciero, on_delete=models.PROTECT)
    alias = models.CharField(max_length=100, help_text="Nombre identificativo del método")
    
    fecha_registro = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    desactivado_por_catalogo = models.BooleanField(default=False, help_text="Indica si fue desactivado por desactivación de catálogo (banco/billetera digital)")
    
    class Meta:
        verbose_name = "Detalle de Método Financiero"
        verbose_name_plural = "Detalles de Métodos Financieros"
        constraints = [
            # Solo los clientes no pueden tener alias duplicados, no aplica para casa
            models.UniqueConstraint(
                fields=['cliente', 'alias'], 
                condition=models.Q(cliente__isnull=False),
                name='unique_cliente_alias'
            ),
        ]
        indexes = [
            models.Index(fields=['cliente', 'is_active']),
            models.Index(fields=['es_cuenta_casa', 'is_active']),
        ]
    
    def clean(self):
        """Validaciones del modelo"""
        # Validación: debe ser cliente XOR casa
        if self.es_cuenta_casa and self.cliente:
            raise ValidationError("Una cuenta de casa no puede tener cliente asignado")
        if not self.es_cuenta_casa and not self.cliente:
            raise ValidationError("Una cuenta de cliente debe tener cliente asignado")
    
    def __str__(self):
        if self.es_cuenta_casa:
            return f"Casa - {self.alias}"
        return f"{self.cliente} - {self.alias}"



# ======= MODELOS ESPECÍFICOS DE DETALLES ========

class CuentaBancaria(models.Model):
    """Detalles específicos de cuenta bancaria"""
    metodo_financiero_detalle = models.OneToOneField(
        MetodoFinancieroDetalle, 
        on_delete=models.CASCADE,
        related_name='cuenta_bancaria'
    )
    banco = models.ForeignKey(Banco, on_delete=models.PROTECT, help_text="Banco del catálogo")
    numero_cuenta = models.CharField(max_length=50)
    titular = models.CharField(max_length=100)
    cbu_cvu = models.CharField(max_length=22, blank=True, help_text="CBU o CVU")
    
    class Meta:
        verbose_name = "Cuenta Bancaria"
        verbose_name_plural = "Cuentas Bancarias"

    def __str__(self):
        return f"{self.banco.nombre} - {self.numero_cuenta} ({self.titular})"


class BilleteraDigital(models.Model):
    """Detalles específicos de billetera digital"""
    metodo_financiero_detalle = models.OneToOneField(
        MetodoFinancieroDetalle, 
        on_delete=models.CASCADE,
        related_name='billetera_digital'
    )
    plataforma = models.ForeignKey(BilleteraDigitalCatalogo, on_delete=models.PROTECT, help_text="Billetera del catálogo")
    usuario_id = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    alias_billetera = models.CharField(max_length=50, blank=True)
    
    class Meta:
        verbose_name = "Billetera Digital"
        verbose_name_plural = "Billeteras Digitales"
    
    def __str__(self):
        return f"{self.plataforma.nombre} - {self.usuario_id}"


class Tarjeta(models.Model):
    """Detalles específicos de tarjeta de crédito/débito"""
    metodo_financiero_detalle = models.OneToOneField(
        MetodoFinancieroDetalle, 
        on_delete=models.CASCADE,
        related_name='tarjeta'
    )
    stripe_payment_method_id = models.CharField(max_length=100, unique=True)  # ID de Stripe
    brand = models.CharField(max_length=50)  # Visa, Mastercard, etc.
    last4 = models.CharField(max_length=4)   # Últimos 4 dígitos
    exp_month = models.IntegerField()
    exp_year = models.IntegerField()
    titular = models.CharField(max_length=100)
    
    class Meta:
        verbose_name = "Tarjeta de Crédito/Débito"
        verbose_name_plural = "Tarjetas de Crédito/Débito"
    
    def __str__(self):
        return f"{self.brand} ****{self.last4} ({self.titular})"




class Cheque(models.Model):
    """Detalles específicos de cheque"""
    ##Va ser parte de la operacion ya que no es reutilizable, no es un detalle de metodo financiero
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, null=True)
    banco_emisor = models.ForeignKey(Banco, on_delete=models.PROTECT, help_text="Banco emisor del cheque")
    titular = models.CharField(max_length=100)
    numero = models.CharField(max_length=50, unique=True)
    tipo = models.CharField(max_length=15, choices=[
        ('NORMAL', 'Cheque Normal'),
        ('ADELANTADO', 'Cheque Adelantado')
    ])
    monto = models.DecimalField(max_digits=18, decimal_places=2)
    
    # Estados y fechas
    estado = models.CharField(max_length=15, choices=[
        ('PENDIENTE', 'Pendiente'),
        ('ACEPTADO', 'Aceptado'),
        ('RECHAZADO', 'Rechazado'),
        ('COBRADO', 'Cobrado')
    ], default='PENDIENTE')
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)
    fecha_procesamiento = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Cheque"
        verbose_name_plural = "Cheques"
    
    def __str__(self):
        return f"Cheque {self.numero} - {self.banco_emisor.nombre} ({self.estado})"


#======================== MODELO SIMULACION PARA PERMISOS ========================
class Simulacion(models.Model):
    """
    Modelo simbólico para asociar permisos de simulación.

    Nota:
    - No se persisten simulaciones en la base de datos.
    - Sirve para registrar permisos personalizados en la UI.
    """
    class Meta:
        default_permissions = ()
        permissions = [
            ("can_use_simulacion", "Puede usar simulación de operaciones"),
        ]