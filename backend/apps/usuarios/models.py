import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.roles.models import Rol   # asumiendo que tu modelo está en apps/roles/models.py

class Usuario(AbstractUser):
    # Reemplazamos el ID entero por UUID
    idUsuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    def __str__(self):
        return self.username
