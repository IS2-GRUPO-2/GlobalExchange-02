from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente
)
from apps.notificaciones.serializers import (
    NotificacionTasaUsuarioSerializer,
    NotificacionTasaClienteSerializer
)


class NotificacionTasaUsuarioView(APIView):
    """
    Vista para gestionar las notificacion de tasas del usuario.

    GET: Obtiene las notificaciones de tasa actuales configuradas por el usuario (crea si no existen)
    PATCH: Actualiza las notificaciones de tasa
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, user):
        preferencia, _ = NotificacionTasaUsuario.objects.get_or_create(
            usuario=user)
        return preferencia

    def get(self, request):
        preferencia = self.get_object(request.user)
        serializer = NotificacionTasaUsuarioSerializer(preferencia)
        return Response(serializer.data)

    def patch(self, request):
        preferencia = self.get_object(request.user)
        serializer = NotificacionTasaUsuarioSerializer(
            preferencia, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NotificacionTasaClienteView(APIView):
    """
    Vista para gestionar las notificaciones de tasa del cliente actual.

    GET: Obtiene las notificaciones de tasa del cliente actual
    PATCH: Actualiza las notificaciones de tasa del cliente actual
    """
    permission_classes = [IsAuthenticated]

    def get_cliente_actual(self, user):
        return getattr(user, "cliente_actual", None)

    def get_object(self, cliente):
        preferencia, _ = NotificacionTasaCliente.objects.get_or_create(
            cliente=cliente)
        return preferencia

    def get(self, request):
        cliente = self.get_cliente_actual(request.user)
        if not cliente:
            return Response({"error": "No hay un cliente seleccionado"}, status=400)

        preferencia = self.get_object(cliente)
        serializer = NotificacionTasaClienteSerializer(preferencia)
        return Response(serializer.data)

    def patch(self, request):
        cliente = self.get_cliente_actual(request.user)
        if not cliente:
            return Response({"error": "No hay un cliente seleccionado"}, status=400)

        preferencia = self.get_object(cliente)
        serializer = NotificacionTasaClienteSerializer(
            preferencia, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
