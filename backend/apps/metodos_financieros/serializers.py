"""
Módulo de serializers para el módulo de operaciones.

Define representación JSON para los modelos relacionados con métodos
financieros y sus detalles. Sigue la convención usada en
`apps.usuarios.serializers` para docstrings y comportamiento de creación.
"""

from rest_framework import serializers

# Importamos todos los modelos
from .models import (
    Banco,
    BilleteraDigitalCatalogo,
    TarjetaCatalogo,
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    Cheque
)
class BancoSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de bancos.
    
    Permite gestionar la lista de bancos disponibles en el sistema.
    """
    class Meta:
        model = Banco
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class BilleteraDigitalCatalogoSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de billeteras digitales.
    
    Permite gestionar la lista de billeteras digitales disponibles en el sistema.
    """
    class Meta:
        model = BilleteraDigitalCatalogo
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class TarjetaCatalogoSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de marcas de tarjetas locales.
    
    Permite gestionar la lista de marcas de tarjetas locales disponibles en el sistema.
    """
    class Meta:
        model = TarjetaCatalogo
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class MetodoFinancieroSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de métodos financieros.

    """
    class Meta:
        model = MetodoFinanciero
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class MetodoFinancieroDetalleSerializer(serializers.ModelSerializer):
    """
    Serializer para instancias específicas de métodos financieros.

    Validaciones importantes se realizan en el modelo (`clean()`), pero
    aquí se pueden añadir validaciones de nivel API si se requiere.
    """

    class Meta:
        model = MetodoFinancieroDetalle
        fields = '__all__'
        read_only_fields = ('fecha_registro',)


class CuentaBancariaSerializer(serializers.ModelSerializer):
    """
    Serializer para detalles de cuentas bancarias.

    Incluye información del banco desde el catálogo.
    """
    banco_nombre = serializers.CharField(source='banco.nombre', read_only=True)
    banco_activo = serializers.BooleanField(source='banco.is_active', read_only=True)
    metodo_financiero_detalle_data = MetodoFinancieroDetalleSerializer(source='metodo_financiero_detalle', read_only=True)

    class Meta:
        model = CuentaBancaria
        fields = '__all__'
        
    def to_representation(self, instance):
        """Personalizar la representación para incluir metodo_financiero_detalle"""
        representation = super().to_representation(instance)
        # Mover los datos del detalle al nombre esperado por el frontend
        representation['metodo_financiero_detalle'] = representation.pop('metodo_financiero_detalle_data', None)
        return representation


class BilleteraDigitalSerializer(serializers.ModelSerializer):
    """
    Serializer para billeteras digitales.

    Incluye información de la plataforma desde el catálogo.
    """
    plataforma_nombre = serializers.CharField(source='plataforma.nombre', read_only=True)
    plataforma_activa = serializers.BooleanField(source='plataforma.is_active', read_only=True)
    metodo_financiero_detalle_data = MetodoFinancieroDetalleSerializer(source='metodo_financiero_detalle', read_only=True)
    
    class Meta:
        model = BilleteraDigital
        fields = '__all__'
        
    def to_representation(self, instance):
        """Personalizar la representación para incluir metodo_financiero_detalle"""
        representation = super().to_representation(instance)
        # Mover los datos del detalle al nombre esperado por el frontend
        representation['metodo_financiero_detalle'] = representation.pop('metodo_financiero_detalle_data', None)
        return representation


class TarjetaSerializer(serializers.ModelSerializer):
    """
    Serializer para tarjetas de crédito/débito.

    Nota: `payment_method_id` es único y obligatorio para la integración
    con Stripe.
    
    """
    metodo_financiero_detalle_data = MetodoFinancieroDetalleSerializer(source='metodo_financiero_detalle', read_only=True)
    
    class Meta:
        model = Tarjeta
        fields = '__all__'
        
    def to_representation(self, instance):
        """Personalizar la representación para incluir metodo_financiero_detalle"""
        representation = super().to_representation(instance)
        # Mover los datos del detalle al nombre esperado por el frontend
        representation['metodo_financiero_detalle'] = representation.pop('metodo_financiero_detalle_data', None)
        return representation  


class ChequeSerializer(serializers.ModelSerializer):
    """
    Serializer para cheques.

    Incluye validaciones específicas en el modelo.
    """
    class Meta:
        model = Cheque
        fields = '__all__'
