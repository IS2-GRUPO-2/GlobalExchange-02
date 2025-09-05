"""
Módulo de serializers para el módulo de operaciones.

Define representación JSON para los modelos relacionados con métodos
financieros y sus detalles. Sigue la convención usada en
`apps.usuarios.serializers` para docstrings y comportamiento de creación.
"""

from datetime import date
from rest_framework import serializers

# Importamos todos los modelos
from .models import (
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
)


class MetodoFinancieroSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de métodos financieros.

    Campos adicionales:
        - nombre_display: representación legible del campo `nombre` (choice).
    """
    nombre_display = serializers.CharField(source='get_nombre_display', read_only=True)

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

    Muestra todos los campos por defecto; `metodo_financiero_detalle`
    debe ser el ID del detalle asociado.
    """

    class Meta:
        model = CuentaBancaria
        fields = '__all__'


class BilleteraDigitalSerializer(serializers.ModelSerializer):
    """
    Serializer para billeteras digitales.

    Campos como `email` y `telefono` son opcionales según el modelo.
    """

    class Meta:
        model = BilleteraDigital
        fields = '__all__'


class TarjetaSerializer(serializers.ModelSerializer):
    """
    Serializer para tarjetas de crédito/débito.

    Nota: `stripe_payment_method_id` es único y obligatorio para la integración
    con Stripe.
    """

    class Meta:
        model = Tarjeta
        fields = '__all__'

