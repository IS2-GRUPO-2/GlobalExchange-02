"""
Módulo de serializers para el módulo de operaciones.

Define representación JSON para los modelos relacionados con métodos
financieros y sus detalles. Sigue la convención usada en
`apps.usuarios.serializers` para docstrings y comportamiento de creación.
"""

from rest_framework import serializers

# Importamos todos los modelos
from .models import (
    Transaccion
)
from apps.clientes.serializers import ClienteSerializer
from apps.divisas.serializers import DivisaSerializer
from apps.usuarios.serializers import UserSerializer
from apps.tauser.serializers import TauserSerializer
from apps.metodos_financieros.serializers import MetodoFinancieroSerializer


class TransaccionDetalleSerializer(serializers.ModelSerializer):
    id_user_detalle = UserSerializer(source='id_user', read_only=True)
    cliente_detalle = ClienteSerializer(source='cliente', read_only=True)
    divisa_origen_detalle = DivisaSerializer(
        source='divisa_origen', read_only=True)
    divisa_destino_detalle = DivisaSerializer(
        source='divisa_destino', read_only=True)
    metodo_financiero_detalle = MetodoFinancieroSerializer(
        source='metodo_financiero', read_only=True)
    tauser_detalle = TauserSerializer(source='tauser', read_only=True)

    class Meta:
        model = Transaccion
        fields = [
            'id', 'id_user', 'cliente', 'operacion', 'tasa_aplicada', 'tasa_inicial',
            'divisa_origen', 'divisa_destino', 'monto_origen', 'monto_destino',
            'metodo_financiero', 'fecha_inicio', 'fecha_fin', 'tauser', 'estado',
            'created_at', 'updated_at', 'factura_emitida',
            # Campos detallados para lectura
            'id_user_detalle', 'cliente_detalle', 'divisa_origen_detalle',
            'divisa_destino_detalle', 'metodo_financiero_detalle', 'tauser_detalle'
        ]
        read_only_fields = ['id', 'fecha_inicio', 'created_at', 'updated_at']


class TransaccionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Transaccion
        fields = '__all__'
        read_only_fields = ['id', 'fecha_inicio', 'created_at', 'updated_at']


"""
Serializadores para validar los datos de entrada en las simulaciones de operaciones.
"""


class OperacionSerializer(serializers.Serializer):
    """
    Serializer para operaciones.
    """

    # Campos obligatorios
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    op_perspectiva_casa = serializers.ChoiceField(choices=["compra", "venta"])

    # Campos opcionales
    cliente_id = serializers.UUIDField(required=False, allow_null=True)
    detalle_metodo_id = serializers.IntegerField(
        required=False, allow_null=True)
    metodo_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        """Validar que se proporcione detalle_metodo_id o metodo_id, pero no ambos."""
        detalle_metodo_id = data.get('detalle_metodo_id')
        metodo_id = data.get('metodo_id')

        if not detalle_metodo_id and not metodo_id:
            raise serializers.ValidationError(
                "Debe proporcionar detalle_metodo_id o metodo_id")

        if detalle_metodo_id and metodo_id:
            raise serializers.ValidationError(
                "No puede proporcionar ambos detalle_metodo_id y metodo_id")

        return data
