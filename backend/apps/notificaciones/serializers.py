from rest_framework import serializers
from apps.notificaciones.models import (
    PreferenciaNotificacionUsuario,
    PreferenciaNotificacionCliente
)
from apps.divisas.models import Divisa


class PreferenciaNotificacionUsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para las preferencias de notificación del usuario.
    """
    divisas_suscritas = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Divisa.objects.filter(is_active=True),
        required=False,
        allow_empty=True
    )

    # Campo calculado en get_divisas_detalle()
    divisas_detalle = serializers.SerializerMethodField()

    class Meta:
        model = PreferenciaNotificacionUsuario
        fields = [
            'id',
            'notificaciones_activas',
            'divisas_suscritas',
            'divisas_detalle',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_divisas_detalle(self, obj):
        """Retorna información detallada de las divisas suscritas"""
        return [
            {
                'id': divisa.id,
                'codigo': divisa.codigo,
                'nombre': divisa.nombre,
                'simbolo': divisa.simbolo
            }
            for divisa in obj.divisas_suscritas.all()
        ]


class PreferenciaNotificacionClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para las preferencias de notificación del cliente.
    """
    divisas_suscritas = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Divisa.objects.filter(is_active=True),
        required=False,
        allow_empty=True
    )

    # Campo calculado en get_divisas_detalle()
    divisas_detalle = serializers.SerializerMethodField()

    cliente_nombre = serializers.CharField(
        source='cliente.nombre', read_only=True)

    class Meta:
        model = PreferenciaNotificacionCliente
        fields = [
            'id',
            'cliente',
            'cliente_nombre',
            'notificaciones_activas',
            'divisas_suscritas',
            'divisas_detalle',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'cliente',
                            'fecha_creacion', 'fecha_actualizacion']

    def get_divisas_detalle(self, obj):
        """Retorna información detallada de las divisas suscritas"""
        return [
            {
                'id': divisa.id,
                'codigo': divisa.codigo,
                'nombre': divisa.nombre,
                'simbolo': divisa.simbolo
            }
            for divisa in obj.divisas_suscritas.all()
        ]
