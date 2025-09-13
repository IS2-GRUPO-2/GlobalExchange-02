from django.db import models


class Simulacion(models.Model):
    """Modelo para asociar permisos de simulación"""
    class Meta:
        permissions = [
            ("can_use_simulacion", "Puede usar simulación de operaciones"),
        ]