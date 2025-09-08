from django.urls import path
from .views import simular_conversion, listar_metodos_disponibles

urlpatterns = [
    path("simular/", simular_conversion, name="simular-conversion"),
    path("metodos-disponibles/", listar_metodos_disponibles, name="metodos-disponibles"),
]