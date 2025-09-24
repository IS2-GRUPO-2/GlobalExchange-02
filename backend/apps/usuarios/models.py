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
    """
    email_verified = models.BooleanField(default=False)
    clientes = models.ManyToManyField(
        "clientes.Cliente",   # referencia al modelo Cliente por app_label.ModelName
        related_name="usuarios",
        blank=True
    )
    clienteActual = models.ForeignKey(
        "clientes.Cliente",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_cliente_actual"
    )
    class Meta:
        permissions = [
            ("can_assign_clients", "Puede asignar clientes a usuarios"),
            ("can_assign_roles", "Puede asignar roles a usuarios"),
        ]
    def __str__(self):
        """Retorna el nombre de usuario como representación del objeto."""
        return self.username
