"""
Módulo de serializers para la gestión de tasas.

Define el serializer principal para el modelo Tasa, incluyendo
validaciones personalizadas, cálculo dinámico de tasas de compra/venta,
y manejo automático del historial asociado.
"""
from decimal import Decimal
from rest_framework import serializers
from apps.cotizaciones.models import Tasa

from apps.cotizaciones.service import TasaService



class TasaSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Tasa.
    
    Incluye campos calculados dinámicamente (`tasaCompra` y `tasaVenta`),
    validaciones de negocio y lógica extendida para crear o actualizar
    instancias junto con su historial.
    
    Campos adicionales:
        - tasaCompra (str): Valor de la tasa de compra, calculado por TasaService.
        - tasaVenta (str): Valor de la tasa de venta, calculado por TasaService.
    """
    tasaCompra = serializers.SerializerMethodField()
    tasaVenta  = serializers.SerializerMethodField()

    class Meta:
        model = Tasa
        fields = (
            "id", "divisa",
            "precioBase", "comisionBaseCompra", "comisionBaseVenta", "activo",
            "tasaCompra", "tasaVenta",
            "fechaCreacion", "fechaActualizacion",
        )
        read_only_fields = ("id", "fechaCreacion", "fechaActualizacion")

    
    def get_tasaCompra(self, obj):
        """
        Calcula la tasa de compra de la divisa asociada.
        
        Args:
            obj (Tasa): Instancia de la tasa.
        
        Returns:
            str: Valor calculado de la tasa de compra.
        """
        valor = TasaService.calcular_tasa_compra(obj)
        return str(valor)

    def get_tasaVenta(self, obj):
        """
        Calcula la tasa de venta de la divisa asociada.
        
        Args:
            obj (Tasa): Instancia de la tasa.
        
        Returns:
            str: Valor calculado de la tasa de venta.
        """
        valor = TasaService.calcular_tasa_venta(obj)
        return str(valor)


    # ---- Validaciones ----
    def validate(self, attrs):
        """
        Aplica validaciones de negocio sobre la tasa.
        
        Reglas:
            - Una divisa no puede tener más de una tasa activa.
            - No se puede cambiar la divisa de una tasa ya creada.
            - No se puede activar la tasa si la divisa está inactiva.
        
        Args:
            attrs (dict): Datos validados del serializer.
        
        Returns:
            dict: Datos validados tras aplicar las reglas.
        
        Raises:
            serializers.ValidationError: Si se incumple alguna regla.
        """
        instance = getattr(self, "instance", None)
        divisa = attrs.get("divisa") or (instance.divisa if instance else None)
        activo = attrs.get("activo", instance.activo if instance else True)

        if instance is None:
            if divisa is None:
                raise serializers.ValidationError("Debe especificar una divisa.")
            if Tasa.objects.filter(divisa=divisa).exists():

                raise serializers.ValidationError("La divisa ya tiene una Cotización asociada.")

        if instance is not None and "divisa" in attrs and divisa != instance.divisa:
            raise serializers.ValidationError("No se puede cambiar la divisa de una Cotización.")

        if activo and divisa and not divisa.is_active:
            raise serializers.ValidationError("No se puede activar una Cotización si la divisa está inactiva.")


        return attrs

    # ---- Create/Update con historial ----
    def create(self, validated_data):
        """
        Crea una nueva tasa y su primer historial asociado.
        
        Args:
            validated_data (dict): Datos validados para crear la tasa.
        
        Returns:
            Tasa: Instancia creada.
        """
        tasa = Tasa.objects.create(**validated_data)
        TasaService.crear_historial(tasa)
        return tasa

    def update(self, instance, validated_data):
        """
        Actualiza los campos de una tasa y genera un nuevo historial
        si cambian los valores base o comisiones.
        
        Args:
            instance (Tasa): Instancia existente a actualizar.
            validated_data (dict): Datos validados.
        
        Returns:
            Tasa: Instancia actualizada.
        """
        old_precio   = Decimal(instance.precioBase)
        old_comision_compra = Decimal(instance.comisionBaseCompra)
        old_comision_venta = Decimal(instance.comisionBaseVenta)

        instance.precioBase   = validated_data.get("precioBase", instance.precioBase)
        instance.comisionBaseCompra = validated_data.get("comisionBaseCompra", instance.comisionBaseCompra)
        instance.comisionBaseVenta = validated_data.get("comisionBaseVenta", instance.comisionBaseVenta)

        if "activo" in validated_data:
            instance.activo = validated_data["activo"]

        instance.save()

        if Decimal(instance.precioBase) != old_precio or Decimal(instance.comisionBaseCompra) != old_comision_compra or Decimal(instance.comisionBaseVenta) != old_comision_venta:
            TasaService.crear_historial(instance)

        return instance
