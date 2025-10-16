from django.urls import path
from apps.notificaciones.views import (
    NotificacionTasaUsuarioView,
    NotificacionTasaClienteView
)

urlpatterns = [
    # Preferencia de usuario
    path(
        'tasa/usuario/',
        NotificacionTasaUsuarioView.as_view(),
        name='tasa-usuario'
    ),

    # Preferencias de cliente
    path(
        'tasa/cliente/',
        NotificacionTasaClienteView.as_view(),
        name='tasa-cliente'
    )
]
