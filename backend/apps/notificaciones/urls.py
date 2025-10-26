from django.urls import path
from apps.notificaciones.views import (
    NotificacionTasaUsuarioView,
    NotificacionTasaClienteView,
    NotificacionCambioTasaView,
)

urlpatterns = [
    # Notificaciones de usuario
    path(
        'tasa/usuario/',
        NotificacionTasaUsuarioView.as_view(),
        name='tasa-usuario'
    ),

    # Notificaciones de cliente
    path(
        'tasa/cliente/',
        NotificacionTasaClienteView.as_view(),
        name='tasa-cliente'
    ),

    # Notificaciones toast de cambio de tasa
    path(
        'tasa/eventos/',
        NotificacionCambioTasaView.as_view(),
        name='tasa-eventos'
    ),
]
