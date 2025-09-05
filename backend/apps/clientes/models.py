import uuid
from django.db import models

class CategoriaCliente(models.Model):
    """
    Modelo de categoría de cliente.
    Atributos:
        idCategoria (UUID): Identificador único de la categoría.
        nombre (str): Nombre de la categoría.
        descripcion (str): Descripción de la categoría.
        descuento (Decimal): Porcentaje de descuento asociado a la categoría.
    """
    idCategoria = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Porcentaje de descuento en la comisión")

    def __str__(self):
        return f"{self.nombre} ({self.descuento}%)"

class Cliente(models.Model):
    """
    Modelo de cliente.
    
    Atributos:
        idCliente (UUID): Identificador único del cliente.
        nombre (str): Nombre completo del cliente.
        isPersonaFisica (bool): Indica si el cliente es una persona física.
        categoria (ForeignKey): Relación con la categoría del cliente.
        cedula (str): Cédula de identidad del cliente (única).
        correo (str): Correo electrónico del cliente (único).
        telefono (str): Número de teléfono del cliente.
        direccion (str): Dirección física del cliente.
        isActive (bool): Indica si el cliente está activo.
        ruc (str): Registro Único de Contribuyentes del cliente (único).
    """
    idCliente = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    isPersonaFisica = models.BooleanField(default=True)
    categoria = models.ForeignKey(CategoriaCliente, on_delete=models.PROTECT, related_name="clientes")
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

