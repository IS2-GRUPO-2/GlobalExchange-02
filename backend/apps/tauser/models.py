from django.db import models

import uuid
from django.db import models


class Tauser(models.Model):
    """
    Modelo de terminal de autoservicio (Tauser).
    
    Atributos:
        id (UUID): Identificador único del Tauser.
        codigo (str): Código interno único del Tauser.
        nombre (str): Nombre del Tauser.
        direccion (str): Dirección física del Tauser.
        ciudad (str): Ciudad donde se ubica el Tauser.
        departamento (str): Departamento/Provincia donde se ubica el Tauser.
        latitud (Decimal): Latitud geográfica.
        longitud (Decimal): Longitud geográfica.
        is_active (bool): Indica si el Tauser está activo.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    direccion = models.TextField()
    ciudad = models.CharField(max_length=100)
    departamento = models.CharField(max_length=100)
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

