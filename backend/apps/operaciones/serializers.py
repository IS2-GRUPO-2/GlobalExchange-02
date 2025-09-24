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
    TarjetaLocalCatalogo,
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    TarjetaLocal,
    Cheque,
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


class TarjetaLocalCatalogoSerializer(serializers.ModelSerializer):
    """
    Serializer para el catálogo de marcas de tarjetas locales.
    
    Permite gestionar la lista de marcas de tarjetas locales disponibles en el sistema.
    """
    class Meta:
        model = TarjetaLocalCatalogo
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

    class Meta:
        model = CuentaBancaria
        fields = '__all__'


class BilleteraDigitalSerializer(serializers.ModelSerializer):
    """
    Serializer para billeteras digitales.

    Incluye información de la plataforma desde el catálogo.
    """
    plataforma_nombre = serializers.CharField(source='plataforma.nombre', read_only=True)
    plataforma_activa = serializers.BooleanField(source='plataforma.is_active', read_only=True)
    
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


class TarjetaLocalSerializer(serializers.ModelSerializer):
    """
    Serializer para tarjetas locales.

    Incluye información de la marca desde el catálogo.
    """
    marca_nombre = serializers.CharField(source='marca.marca', read_only=True)
    marca_activa = serializers.BooleanField(source='marca.is_active', read_only=True)

    class Meta:
        model = TarjetaLocal
        fields = '__all__'  

class ChequeSerializer(serializers.ModelSerializer):
    """
    Serializer para cheques.

    Incluye validaciones específicas en el modelo.
    """
    class Meta:
        model = Cheque
        fields = '__all__'
        read_only_fields = ('fecha_emision', 'estado', 'fecha_validacion_analista', 'analista')

# ======================== Serializers para vistas de simulación de operación ========================
"""
Serializadores para validar los datos de entrada en las simulaciones de operaciones.
"""

class SimulacionPrivadaSerializer(serializers.Serializer):
    """
    Serializer para usuarios autenticados.
    Requiere un cliente_id además de divisas, monto y método.
    """
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()


class SimulacionPublicaSerializer(serializers.Serializer):
    """
    Serializer para usuarios invitados.
    No requiere cliente_id, solo datos básicos de simulación de operación.
    """
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()
