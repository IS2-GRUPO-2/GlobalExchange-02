from rest_framework import serializers

class SimulacionSerializer(serializers.Serializer):
    cliente_id = serializers.UUIDField()
    divisa_id = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_pago = serializers.CharField(max_length=20)
    operacion = serializers.ChoiceField(choices=["compra", "venta"])
