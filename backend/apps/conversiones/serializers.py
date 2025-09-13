from rest_framework import serializers


class SimulacionPrivadaSerializer(serializers.Serializer):
    """
    Para usuarios autenticados: requiere cliente_id además de divisas y método.
    """
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()


class SimulacionPublicaSerializer(serializers.Serializer):
    """
    Para usuarios invitados: no se requiere cliente_id.
    """
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()
