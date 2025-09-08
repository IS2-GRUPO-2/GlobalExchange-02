from django.urls import path
from .views import simular_conversion

urlpatterns = [
    path("simular/", simular_conversion, name="simular-conversion"),
]