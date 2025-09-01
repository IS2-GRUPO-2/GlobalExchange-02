from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email_verified = models.BooleanField(default=False)
    clientes = models.ManyToManyField(
        "clientes.Cliente",   # referencia al modelo Cliente por app_label.ModelName
        related_name="usuarios",
        blank=True
    )
    class Meta:
        permissions = [
            ("can_assign_clients", "Puede asignar clientes a usuarios"),
            ("can_assign_roles", "Puede asignar roles a usuarios"),
        ]
    def __str__(self):
        return self.username
