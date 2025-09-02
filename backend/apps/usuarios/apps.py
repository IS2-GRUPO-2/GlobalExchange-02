"""
Configuración de la aplicación de usuarios.

Define la configuración específica de la app usuarios dentro del proyecto Django.
"""

from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    """
    Configuración de la aplicación usuarios.
    
    Define el tipo de campo por defecto para claves primarias
    y el nombre de la aplicación.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.usuarios'
