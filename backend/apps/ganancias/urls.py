"""
Configuración de URLs para la app de ganancias.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GananciaViewSet

router = DefaultRouter()
router.register(r'ganancias', GananciaViewSet, basename='ganancia')

urlpatterns = [
    path('', include(router.urls)),
]
