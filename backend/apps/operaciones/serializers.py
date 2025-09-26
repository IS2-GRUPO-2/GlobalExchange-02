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
    Cheque,
    Transaccion,
)
from apps.clientes.serializers import ClienteSerializer
from apps.divisas.serializers import DivisaSerializer
from apps.usuarios.serializers import UserSerializer
from apps.tauser.serializers import TauserSerializer


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

    Nota: `payment_method_id` es único y obligatorio para la integración
    con Stripe.
    
    """
    class Meta:
        model = Tarjeta
        fields = '__all__'  


class ChequeSerializer(serializers.ModelSerializer):
    """
    Serializer para cheques.

    Incluye validaciones específicas en el modelo.
    """
    class Meta:
        model = Cheque
        fields = '__all__'

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



class SimulacionPrivadaConInstanciaSerializer(serializers.Serializer):
    """
    Serializer para usuarios autenticados con instancia específica.
    Puede usar detalle_metodo_id (instancia específica) o metodo_id (método genérico).
    """
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    detalle_metodo_id = serializers.IntegerField(required=False, allow_null=True)
    metodo_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        """Validar que se proporcione detalle_metodo_id o metodo_id, pero no ambos."""
        detalle_metodo_id = data.get('detalle_metodo_id')
        metodo_id = data.get('metodo_id')
        
        if not detalle_metodo_id and not metodo_id:
            raise serializers.ValidationError("Debe proporcionar detalle_metodo_id o metodo_id")
        
        if detalle_metodo_id and metodo_id:
            raise serializers.ValidationError("No puede proporcionar ambos detalle_metodo_id y metodo_id")
        
        return data

class MetodosClienteSerializer(serializers.Serializer):
    """
    Serializer para validar parámetros de métodos del cliente.
    """
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    es_operacion_real = serializers.BooleanField(required=False, default=False)

class SimulacionPublicaSerializer(serializers.Serializer):
    """
    Serializer para usuarios invitados.
    No requiere cliente_id, solo datos básicos de simulación de operación.
    """
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    metodo_id = serializers.IntegerField()


class TransaccionSerializer(serializers.ModelSerializer):
    operador_detalle = UserSerializer(source='operador', read_only=True)
    cliente_detalle = ClienteSerializer(source='cliente', read_only=True)
    divisa_origen_detalle = DivisaSerializer(source='divisa_origen', read_only=True)
    divisa_destino_detalle = DivisaSerializer(source='divisa_destino', read_only=True)
    metodo_financiero_detalle = MetodoFinancieroSerializer(source='metodo_financiero', read_only=True)
    tauser_detalle = TauserSerializer(source='tauser', read_only=True)
    
    class Meta:
        model = Transaccion
        fields = [
            'id', 'operador', 'cliente', 'operacion', 'tasa_aplicada', 'tasa_inicial',
            'divisa_origen', 'divisa_destino', 'monto_origen', 'monto_destino',
            'metodo_financiero', 'fecha_inicio', 'fecha_fin', 'tauser', 'estado',
            'created_at', 'updated_at',
            # Campos detallados para lectura
            'operador_detalle', 'cliente_detalle', 'divisa_origen_detalle',
            'divisa_destino_detalle', 'metodo_financiero_detalle', 'tauser_detalle'
        ]
        read_only_fields = ['id', 'fecha_inicio', 'created_at', 'updated_at']

class TransaccionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaccion
        fields = [
            'operador', 'cliente', 'operacion', 'tasa_aplicada', 'tasa_inicial',
            'divisa_origen', 'divisa_destino', 'monto_origen', 'monto_destino',
            'metodo_financiero', 'tauser', 'estado'
        ]
    
    def validate(self, data):
        # Validar que las divisas sean diferentes
        if data['divisa_origen'] == data['divisa_destino']:
            raise serializers.ValidationError("La divisa de origen y destino deben ser diferentes")
        
        # Validar montos positivos
        if data['monto_origen'] <= 0:
            raise serializers.ValidationError("El monto de origen debe ser mayor a 0")
        
        if data['monto_destino'] <= 0:
            raise serializers.ValidationError("El monto de destino debe ser mayor a 0")
        
        return data


class TransaccionOperacionSerializer(serializers.Serializer):
    cliente_id = serializers.UUIDField()
    divisa_origen = serializers.IntegerField()
    divisa_destino = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=30, decimal_places=2)
    detalle_metodo_id = serializers.IntegerField(required=False, allow_null=True)
    metodo_id = serializers.IntegerField(required=False, allow_null=True)
    tauser_id = serializers.UUIDField()
    # Ahora opcional: se aceptará en 'confirmar-pago', no al crear
    terminos_aceptados = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        detalle_metodo_id = data.get('detalle_metodo_id')
        metodo_id = data.get('metodo_id')

        if not detalle_metodo_id and not metodo_id:
            raise serializers.ValidationError("Debe proporcionar detalle_metodo_id o metodo_id")

        if detalle_metodo_id and metodo_id:
            raise serializers.ValidationError("No puede proporcionar ambos detalle_metodo_id y metodo_id")

        # No obligamos terminos_aceptados aquí
        return data