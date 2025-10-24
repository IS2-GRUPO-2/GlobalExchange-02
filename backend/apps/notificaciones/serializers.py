from rest_framework import serializers
from decimal import Decimal
from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente,
    NotificacionCambioTasa,
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


class NotificacionCambioTasaSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones toast generadas por cambios de tasa."""

    divisa = serializers.SerializerMethodField()
    par_divisa = serializers.SerializerMethodField()
    tasa_compra = serializers.SerializerMethodField()
    tasa_venta = serializers.SerializerMethodField()

    class Meta:
        model = NotificacionCambioTasa
        fields = [
            'id',
            'tipo_evento',
            'titulo',
            'descripcion',
            'divisa',
            'par_divisa',
            'tasa_compra',
            'tasa_venta',
            'created_at'
        ]

    def _format_decimal(self, value: Decimal) -> str:
        return f"{value:.4f}".rstrip('0').rstrip('.') if value is not None else "0"

    def _build_variacion(self, nueva: Decimal, anterior: Decimal):
        variacion = nueva - anterior
        porcentaje = Decimal('0')
        if anterior and anterior != 0:
            porcentaje = (variacion / anterior) * Decimal('100')
        return {
            'anterior': self._format_decimal(anterior),
            'nueva': self._format_decimal(nueva),
            'variacion': self._format_decimal(variacion),
            'variacion_porcentaje': self._format_decimal(porcentaje),
            'es_incremento': variacion > 0,
            'es_decremento': variacion < 0
        }

    def get_divisa(self, obj):
        divisa = obj.divisa
        return {
            'id': divisa.id,
            'codigo': divisa.codigo,
            'nombre': divisa.nombre,
            'simbolo': divisa.simbolo
        }

    def get_par_divisa(self, obj):
        base_codigo = Divisa.objects.filter(es_base=True).values_list('codigo', flat=True).first()
        if not base_codigo:
            base_codigo = 'BASE'
        return f"{obj.divisa.codigo}/{base_codigo}"

    def get_tasa_compra(self, obj):
        return self._build_variacion(obj.tasa_compra_nueva, obj.tasa_compra_anterior)

    def get_tasa_venta(self, obj):
        return self._build_variacion(obj.tasa_venta_nueva, obj.tasa_venta_anterior)
