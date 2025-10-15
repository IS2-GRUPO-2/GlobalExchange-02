from django.urls import path
from apps.notificaciones.views import (
    PreferenciaNotificacionUsuarioView,
    PreferenciaNotificacionClienteView
)

urlpatterns = [
    # Preferencias de usuario
    path(
        'preferencias/usuario/',
        PreferenciaNotificacionUsuarioView.as_view(),
        name='preferencias-usuario'
    ),

    # Preferencias de cliente
    path(
        'preferencias/cliente/',
        PreferenciaNotificacionClienteView.as_view(),
        name='preferencias-cliente'
    )
]
