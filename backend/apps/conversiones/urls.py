"""
Definición de rutas para la aplicación de simulación.
Prefijo raíz: /api/conversiones/
"""

from django.urls import path
from .views import (
    simular_conversion,
    simular_conversion_publica,
    listar_metodos_disponibles,
)

urlpatterns = [
    path("simular/", simular_conversion, name="simular-conversion"),
    path("simular-publica/", simular_conversion_publica, name="simular-conversion-publica"),
    path("metodos-disponibles/", listar_metodos_disponibles, name="metodos-disponibles"),
]
