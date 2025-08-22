from django.db import models
import uuid
# from django.conf import settings  # para referenciar al modelo de User
# Create your models here.


import uuid
from django.db import models

class Cliente(models.Model):
    CATEGORIAS = [
        ("VIP", "VIP"),
        ("CORPORATIVO", "Corporativo"),
        ("MINORISTA", "Minorista"),
    ]

    idCliente = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    isPersonaFisica = models.BooleanField(default=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    cedula = models.CharField(max_length=20, unique=True, null=True, blank=True)
    correo = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20)
    direccion = models.TextField()
    isActive = models.BooleanField(default=True)
    ruc = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def __str__(self):
        return self.nombre
    

    # # Relación ManyToMany con User
    # usuarios = models.ManyToManyField(
    #     settings.AUTH_USER_MODEL,  # referencia a tu modelo custom User
    #     related_name="clientes",
    #     blank=True
    # )

