from django.db import models
from apps.usuarios.models import User
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa

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
