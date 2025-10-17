from rest_framework import serializers
from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente
)
from apps.divisas.models import Divisa


class NotificacionTasaUsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para las notificaciones de tasa del usuario.
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
        model = NotificacionTasaUsuario
        fields = [
            'id',
            'is_active',
            'divisas_suscritas',
            'divisas_detalle',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def update(self, instance, validated_data):
        divisas = validated_data.pop('divisas_suscritas', None)
        instance = super().update(instance, validated_data)
        if divisas is not None:
            instance.divisas_suscritas.set(divisas)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['divisas_suscritas'] = data.get('divisas_suscritas') or []
        data['divisas_detalle'] = data.get('divisas_detalle') or []
        return data

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


class NotificacionTasaClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para las notificaciones de tasa del cliente.
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
        model = NotificacionTasaCliente
        fields = [
            'id',
            'cliente',
            'cliente_nombre',
            'is_active',
            'divisas_suscritas',
            'divisas_detalle',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'cliente',
                            'fecha_creacion', 'fecha_actualizacion']

    def update(self, instance, validated_data):
        divisas = validated_data.pop('divisas_suscritas', None)
        instance = super().update(instance, validated_data)
        if divisas is not None:
            instance.divisas_suscritas.set(divisas)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['divisas_suscritas'] = data.get('divisas_suscritas') or []
        data['divisas_detalle'] = data.get('divisas_detalle') or []
        return data

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
