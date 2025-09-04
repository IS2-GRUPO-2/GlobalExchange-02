from decimal import Decimal
from rest_framework import serializers
from apps.cotizaciones.models import Tasa
from apps.cotizaciones.service import TasaService, TasaFormatter


class TasaSerializer(serializers.ModelSerializer):
    tasaCompra = serializers.SerializerMethodField()
    tasaVenta  = serializers.SerializerMethodField()

    class Meta:
        model = Tasa
        fields = (
            "id", "divisa",
            "precioBase", "comisionBase", "activo",
            "tasaCompra", "tasaVenta",
            "fechaCreacion", "fechaActualizacion",
        )
        read_only_fields = ("id", "fechaCreacion", "fechaActualizacion")

    # ---- Campos formateados con la divisa base ----
    def get_tasaCompra(self, obj):
        valor = TasaService.calcular_tasa_compra(obj)
        return TasaFormatter.formatear(Decimal(valor))

    def get_tasaVenta(self, obj):
        valor = TasaService.calcular_tasa_venta(obj)
        return TasaFormatter.formatear(Decimal(valor))

    # ---- Validaciones ----
    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        divisa = attrs.get("divisa") or (instance.divisa if instance else None)
        activo = attrs.get("activo", instance.activo if instance else True)

        if instance is None:
            if divisa is None:
                raise serializers.ValidationError("Debe especificar una divisa.")
            if Tasa.objects.filter(divisa=divisa).exists():
                raise serializers.ValidationError("La divisa ya tiene una Tasa asociada.")

        if instance is not None and "divisa" in attrs and divisa != instance.divisa:
            raise serializers.ValidationError("No se puede cambiar la divisa de una Tasa.")

        if activo and divisa and not divisa.is_active:
            raise serializers.ValidationError("No se puede activar una Tasa si la divisa está inactiva.")

        return attrs

    # ---- Create/Update con historial ----
    def create(self, validated_data):
        tasa = Tasa.objects.create(**validated_data)
        TasaService.crear_historial(tasa)
        return tasa

    def update(self, instance, validated_data):
        old_precio   = Decimal(instance.precioBase)
        old_comision = Decimal(instance.comisionBase)

        instance.precioBase   = validated_data.get("precioBase", instance.precioBase)
        instance.comisionBase = validated_data.get("comisionBase", instance.comisionBase)

        if "activo" in validated_data:
            instance.activo = validated_data["activo"]

        instance.save()

        if Decimal(instance.precioBase) != old_precio or Decimal(instance.comisionBase) != old_comision:
            TasaService.crear_historial(instance)

        return instance
