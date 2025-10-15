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

    def get(self, request):
        """Obtiene o crea las preferencias del usuario"""
        preferencia, created = PreferenciaNotificacionUsuario.objects.get_or_create(
            usuario=request.user
        )
        serializer = PreferenciaNotificacionUsuarioSerializer(preferencia)
        return Response(serializer.data)

    def put(self, request):
        """Actualiza las preferencias del usuario"""
        preferencia, created = PreferenciaNotificacionUsuario.objects.get_or_create(
            usuario=request.user
        )
        serializer = PreferenciaNotificacionUsuarioSerializer(
            preferencia,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Actualiza parcialmente las preferencias del usuario"""
        return self.put(request)


class PreferenciaNotificacionClienteView(APIView):
    """
    Vista para gestionar las preferencias de notificación del cliente actual.

    GET: Obtiene las preferencias del cliente actual
    PUT/PATCH: Actualiza las preferencias del cliente actual
    """
    permission_classes = [IsAuthenticated]

    def _get_cliente_actual(self, user):
        """Obtiene el cliente actual del usuario"""
        if not user.cliente_actual:
            return None
        return user.cliente_actual

    def get(self, request):
        """Obtiene las preferencias del cliente actual"""
        cliente = self._get_cliente_actual(request.user)

        if not cliente:
            return Response(
                {"error": "No hay un cliente seleccionado actualmente"},
                status=status.HTTP_400_BAD_REQUEST
            )

        preferencia, created = PreferenciaNotificacionCliente.objects.get_or_create(
            cliente=cliente
        )
        serializer = PreferenciaNotificacionClienteSerializer(preferencia)
        return Response(serializer.data)

    def put(self, request):
        """Actualiza las preferencias del cliente actual"""
        cliente = self._get_cliente_actual(request.user)

        if not cliente:
            return Response(
                {"error": "No hay un cliente seleccionado actualmente"},
                status=status.HTTP_400_BAD_REQUEST
            )

        preferencia, created = PreferenciaNotificacionCliente.objects.get_or_create(
            cliente=cliente
        )
        serializer = PreferenciaNotificacionClienteSerializer(
            preferencia,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Actualiza parcialmente las preferencias del cliente actual"""
        return self.put(request)
