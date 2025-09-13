"""
Serializadores para validar los datos de entrada en las simulaciones.
"""

from rest_framework import serializers


class SimulacionPrivadaSerializer(serializers.Serializer):
    """
    Serializer para usuarios autenticados.
    Requiere un cliente_id además de divisas, monto y método.
    """
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()


class SimulacionPublicaSerializer(serializers.Serializer):
    """
    Serializer para usuarios invitados.
    No requiere cliente_id, solo datos básicos de conversión.
    """
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()
