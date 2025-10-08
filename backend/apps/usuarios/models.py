"""
Módulo de modelos para la gestión de usuarios.

Define el modelo User extendido de Django con funcionalidades específicas
para la aplicación GlobalExchange.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser de Django.
    
    Atributos:
        email_verified (bool): Indica si el email del usuario ha sido verificado.
        clientes (ManyToMany): Relación con los clientes asignados al usuario.
        cliente_actual (ForeignKey): Cliente seleccionado actualmente por el usuario.
        mfa_enabled (bool): Indica si el usuario tiene MFA (2FA) habilitado.
    
    **MFA (Multi-Factor Authentication):**
    El campo mfa_enabled controla si el usuario requiere autenticación de dos factores.
    Los dispositivos TOTP y secretos se manejan mediante la librería django-otp
    en la tabla TOTPDevice.
    
    **Autor del campo MFA:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    email_verified = models.BooleanField(default=False)
    clientes = models.ManyToManyField(
        "clientes.Cliente",   # referencia al modelo Cliente por app_label.ModelName
        related_name="usuarios",
        blank=True
    )
    cliente_actual = models.ForeignKey(
        "clientes.Cliente",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_cliente_actual"
    )

    # ============================================
    # MFA (Multi-Factor Authentication)
    # ============================================
    mfa_enabled = models.BooleanField(
        default=False,
        help_text="Indica si el usuario tiene autenticación de dos factores habilitada"
    )
    # NOTA: El secreto TOTP y dispositivos se gestionan automáticamente
    # por django-otp en la tabla otp_totp_totpdevice
    
    class Meta:
        permissions = [
            ("can_assign_clients", "Puede asignar clientes a usuarios"),
            ("can_assign_roles", "Puede asignar roles a usuarios"),
        ]
    def __str__(self):
        """Retorna el nombre de usuario como representación del objeto."""
        return self.username
