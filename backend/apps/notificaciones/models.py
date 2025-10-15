from django.db import models
from apps.usuarios.models import User
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa

# Create your models here.


class PreferenciaNotificacionUsuario(models.Model):
    """
    Preferencias de notificación personales del usuario.

    Atributos:
        usuario (OneToOne): Usuario asociado
        notificaciones_activas (bool): Si desea recibir notificaciones
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
    notificaciones_activas = models.BooleanField(
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
        verbose_name = "Preferencia de Notificación de Usuario"
        verbose_name_plural = "Preferencias de Notificación de Usuarios"
        db_table = "notificaciones_preferencia_usuario"

    def __str__(self):
        estado = "Activas" if self.notificaciones_activas else "Inactivas"
        return f"Preferencias de {self.usuario.username} - {estado}"


class PreferenciaNotificacionCliente(models.Model):
    """
    Preferencias de notificación del cliente (empresa/entidad).

    Estas preferencias aplican a nivel de organización y pueden ser
    configuradas por cualquier usuario con permisos sobre el cliente.

    Atributos:
        cliente (OneToOne): Cliente asociado
        notificaciones_activas (bool): Si el cliente desea recibir notificaciones
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
    notificaciones_activas = models.BooleanField(
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
        verbose_name = "Preferencia de Notificación de Cliente"
        verbose_name_plural = "Preferencias de Notificación de Clientes"
        db_table = "notificaciones_preferencia_cliente"

    def __str__(self):
        estado = "Activas" if self.notificaciones_activas else "Inactivas"
        return f"Preferencias de {self.cliente.nombre} - {estado}"
