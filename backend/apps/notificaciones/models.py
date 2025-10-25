from django.db import models
from apps.usuarios.models import User
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa
from django.utils import timezone

# Create your models here.


class NotificacionTasaUsuario(models.Model):
    """
    Notificación de tasa del usuario.

    Atributos:
        usuario (OneToOne): Usuario asociado
        is_active (bool): Si desea recibir notificaciones
        divisas_suscritas (ManyToMany): Divisas de las que quiere recibir notificaciones
        fecha_creacion (DateTime): Fecha de creación del registro
        fecha_actualizacion (DateTime): Última actualización
    """
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preferencia_notificacion",
        verbose_name="Usuario"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el usuario desea recibir notificaciones de cambio de tasa"
    )
    divisas_suscritas = models.ManyToManyField(
        Divisa,
        blank=True,
        related_name="usuarios_suscritos",
        verbose_name="Divisas suscritas",
        help_text="Divisas de las que el usuario quiere recibir notificaciones"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notificación de Tasa de Usuario"
        verbose_name_plural = "Notificación de Tasa de Usuarios"
        db_table = "notificaciones_tasa_usuario"
        default_permissions = ('view', 'change',)

    def __str__(self):
        estado = "Activas" if self.is_active else "Inactivas"
        return f"Notificaciones de tasa de {self.usuario.username} - {estado}"


class NotificacionTasaCliente(models.Model):
    """
    Notificaciones de tasa del cliente.

    Estas notificaciones pueden ser configuradas por cualquier usuario
    con permisos sobre el cliente.

    Atributos:
        cliente (OneToOne): Cliente asociado
        is_active (bool): Si el cliente desea recibir notificaciones
        divisas_suscritas (ManyToMany): Divisas de interés para el cliente
        fecha_creacion (DateTime): Fecha de creación del registro
        fecha_actualizacion (DateTime): Última actualización
    """
    cliente = models.OneToOneField(
        Cliente,
        on_delete=models.CASCADE,
        related_name="preferencia_notificacion",
        verbose_name="Cliente"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el cliente desea recibir notificaciones de cambio de tasa"
    )
    divisas_suscritas = models.ManyToManyField(
        Divisa,
        blank=True,
        related_name="clientes_suscritos",
        verbose_name="Divisas suscritas",
        help_text="Divisas de las que el cliente quiere recibir notificaciones"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notificación de tasa de Cliente"
        verbose_name_plural = "Notificación de tasa de Clientes"
        db_table = "notificaciones_tasa_cliente"
        default_permissions = ('view', 'change',)

    def __str__(self):
        estado = "Activas" if self.is_active else "Inactivas"
        return f"Notificaciones de tasa de {self.cliente.nombre} - {estado}"

class NotificacionCambioTasa(models.Model):
    """Notificaciones tipo toast por cambio de tasa dirigidas a un usuario."""

    class TipoEvento(models.TextChoices):
        SUSCRIPCION = "suscripcion", "Divisa suscrita"
        TRANSACCION_PENDIENTE = "transaccion_pendiente", "Transacción pendiente"

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notificaciones_cambio_tasa",
        verbose_name="Usuario"
    )
    divisa = models.ForeignKey(
        Divisa,
        on_delete=models.CASCADE,
        related_name="notificaciones_cambio_tasa",
        verbose_name="Divisa"
    )
    tipo_evento = models.CharField(
        max_length=32,
        choices=TipoEvento.choices
    )
    titulo = models.CharField(max_length=120)
    descripcion = models.CharField(max_length=255)
    tasa_compra_anterior = models.DecimalField(max_digits=15, decimal_places=6)
    tasa_compra_nueva = models.DecimalField(max_digits=15, decimal_places=6)
    tasa_venta_anterior = models.DecimalField(max_digits=15, decimal_places=6)
    tasa_venta_nueva = models.DecimalField(max_digits=15, decimal_places=6)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificación de cambio de tasa"
        verbose_name_plural = "Notificaciones de cambio de tasa"
        db_table = "notificaciones_cambio_tasa"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["usuario", "is_read"]),
            models.Index(fields=["divisa"]),
        ]

    def marcar_como_leida(self):
        """Marca la notificación como leída."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])

    def __str__(self):
        return f"{self.get_tipo_evento_display()} - {self.divisa.codigo} - {self.usuario.username}"
