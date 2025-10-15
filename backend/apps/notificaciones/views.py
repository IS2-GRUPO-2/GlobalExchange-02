from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.notificaciones.models import (
    PreferenciaNotificacionUsuario,
    PreferenciaNotificacionCliente
)
from apps.notificaciones.serializers import (
    PreferenciaNotificacionUsuarioSerializer,
    PreferenciaNotificacionClienteSerializer
)


class PreferenciaNotificacionUsuarioView(APIView):
    """
    Vista para gestionar las preferencias de notificación del usuario.

    GET: Obtiene las preferencias actuales (crea si no existen)
    PUT/PATCH: Actualiza las preferencias
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, user):
        preferencia, _ = PreferenciaNotificacionUsuario.objects.get_or_create(
            usuario=user)
        return preferencia

    def get(self, request):
        preferencia = self.get_object(request.user)
        serializer = PreferenciaNotificacionUsuarioSerializer(preferencia)
        return Response(serializer.data)

    def patch(self, request):
        preferencia = self.get_object(request.user)
        serializer = PreferenciaNotificacionUsuarioSerializer(
            preferencia, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PreferenciaNotificacionClienteView(APIView):
    """
    Vista para gestionar las preferencias de notificación del cliente actual.

    GET: Obtiene las preferencias del cliente actual
    PUT/PATCH: Actualiza las preferencias del cliente actual
    """
    permission_classes = [IsAuthenticated]

    def get_cliente_actual(self, user):
        return getattr(user, "cliente_actual", None)

    def get_object(self, cliente):
        preferencia, _ = PreferenciaNotificacionCliente.objects.get_or_create(
            cliente=cliente)
        return preferencia

    def get(self, request):
        cliente = self.get_cliente_actual(request.user)
        if not cliente:
            return Response({"error": "No hay un cliente seleccionado"}, status=400)

        preferencia = self.get_object(cliente)
        serializer = PreferenciaNotificacionClienteSerializer(preferencia)
        return Response(serializer.data)

    def patch(self, request):
        cliente = self.get_cliente_actual(request.user)
        if not cliente:
            return Response({"error": "No hay un cliente seleccionado"}, status=400)

        preferencia = self.get_object(cliente)
        serializer = PreferenciaNotificacionClienteSerializer(
            preferencia, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
