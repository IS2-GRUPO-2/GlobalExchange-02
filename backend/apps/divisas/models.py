from django.db import models
from django.db.models import Q, UniqueConstraint

# Create your models here.
class Divisa(models.Model):
    codigo = models.CharField(verbose_name="Código de divisa", max_length=5, unique=True)
    nombre = models.CharField(verbose_name="Nombre de la divisa", max_length=30)
    simbolo = models.CharField(max_length=1)
    is_active = models.BooleanField(default=True)
    max_digitos = models.IntegerField(default=30)
    precision = models.IntegerField(default=6)
    es_base = models.BooleanField(default=False)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["es_base"],
                condition=Q(es_base=True),
                name="unica_divisa_base"
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Denominacion(models.Model):
    divisa = models.ForeignKey(Divisa, on_delete=models.PROTECT)
    denominacion = models.IntegerField()
    is_active = models.BooleanField(default=True)
