"""
Modelo de simulación usado únicamente para asociar permisos a la app.
No almacena datos de conversiones.
"""
from django.db import models


class Simulacion(models.Model):
    """
    Modelo simbólico para asociar permisos a la app de simulación.

    Nota:
    - No se persisten simulaciones en la base de datos.
    - Sirve para registrar permisos personalizados en la UI.
    """
    class Meta:
        permissions = [
            ("can_use_simulacion", "Puede usar simulación de operaciones"),
        ]