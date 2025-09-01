"""
Configuración de URLs para el módulo de usuarios.

Define las rutas disponibles para las operaciones relacionadas con usuarios
utilizando Django REST Framework Router.
"""

from rest_framework.routers import DefaultRouter
from .views import UserViewSet, me_permissions
from django.urls import path

# Configuración del router para generar automáticamente las URLs del ViewSet
router = DefaultRouter()
router.register(r'usuarios', UserViewSet)

urlpatterns = router.urls
urlpatterns += [
    path("me/permissions/", me_permissions, name="me_permissions"),
]