from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from decimal import Decimal

from .models import (
    MovimientoStock,
    MovimientoStockDetalle,
    StockDivisaCasa,
    StockDivisaTauser,
)
from apps.divisas.models import Denominacion
from apps.divisas.serializers import DivisaSerializer, DenominacionSerializer
from apps.operaciones.models import Transaccion
from apps.tauser.serializers import TauserSerializer

class StockDivisaCasaSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockDivisaCasa
        fields = '__all__'
        
class StockDivisaTauserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockDivisaTauser
        fields = '__all__'
        

class MovimientoStockDetalleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoStockDetalle
        fields = ["denominacion", "cantidad"]        

class MovimientoStockDetalleSerializer(serializers.ModelSerializer):
    denominacion_detalle = DenominacionSerializer(
        source="denominacion", read_only=True)

    class Meta:
        model = MovimientoStockDetalle
        fields = [
            "id",
            "movimiento_stock",
            "denominacion",
            "cantidad",
            "denominacion_detalle",
        ]
        read_only_fields = ["id", "movimiento_stock", "denominacion_detalle"]
class MovimientoStockSerializer(serializers.ModelSerializer):
    detalles = MovimientoStockDetalleCreateSerializer(many=True, required=False)
    detalles_info = MovimientoStockDetalleSerializer(
        many=True,
        read_only=True,
        source="movimientostockdetalle_set"
    )
    tauser_detalle = TauserSerializer(source="tauser", read_only=True)
    tipo_movimiento_detalle = serializers.SerializerMethodField()
    estado_detalle = serializers.SerializerMethodField()
    divisa_detalle = DivisaSerializer(source="divisa", read_only=True)

    class Meta:
        model = MovimientoStock
        fields = [
            "id",
            "tipo_movimiento",
            "tipo_movimiento_detalle",
            "tauser",
            "tauser_detalle",
            "transaccion",
            "fecha",
            "monto",
            "estado",
            "estado_detalle",
            "divisa",
            "divisa_detalle",
            "detalles",
            "detalles_info",
        ]
        extra_kwargs = {
            'transaccion': {'required': False, 'allow_null': True},
            'monto': {'required': False, 'allow_null': True},
            'estado': {'required': False, 'allow_null': True}
        }
        
    def validate(self, attrs):
        # Validar si ya existe un movimiento con esta transacción
        if 'transaccion' in attrs and attrs['transaccion'] is not None:
            if MovimientoStock.objects.filter(transaccion=attrs['transaccion']).exists():
                raise serializers.ValidationError({
                    'transaccion': 'Ya existe un movimiento de stock para esta transacción'
                })

        if 'estado' not in attrs or attrs["estado"] is None:
            attrs["estado"] = "en_proceso"

        # Validar que todas las denominaciones pertenezcan a la divisa seleccionada
        if 'detalles' in attrs and 'divisa' in attrs:
            divisa_id = attrs['divisa'].id
            for detalle in attrs['detalles']:
                denominacion = detalle['denominacion']
                if denominacion.divisa_id != divisa_id:
                    raise serializers.ValidationError({
                        'detalles': f"La denominación {denominacion.denominacion} no pertenece a la divisa seleccionada"
                    })

        # Si no se proporciona monto, pero hay detalles, calculamos el monto total
        if 'monto' not in attrs and 'detalles' in attrs:
            monto_total = Decimal('0')
            for detalle in attrs['detalles']:
                denominacion = detalle['denominacion']
                cantidad = detalle['cantidad']
                # Conversión simplificada: denominacion.denominacion ya es numérico
                monto_total += Decimal(denominacion.denominacion) * cantidad
            attrs['monto'] = monto_total
        elif 'monto' not in attrs:
            # Si no hay monto ni detalles, establecemos 0 como valor por defecto
            attrs['monto'] = Decimal('0')
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop("detalles", [])
        codigo_tipo = validated_data["tipo_movimiento"]
        tauser = validated_data["tauser"]

        movimiento = MovimientoStock.objects.create(**validated_data)
        regla = self._get_regla_stock(codigo_tipo, tauser)

        if codigo_tipo == "SALCLT":
            transaccion = validated_data["transaccion"]
            self._procesar_salida_cliente(movimiento, tauser, transaccion)
        else:
            self._procesar_detalles(movimiento, regla, detalles_data)

        return movimiento
    
    def get_tipo_movimiento_detalle(self, obj):
        return {
            "value": obj.tipo_movimiento,
            "label": obj.get_tipo_movimiento_display(),
        }

    def get_estado_detalle(self, obj):
        return {
            "value": obj.estado,
            "label": obj.get_estado_display(),
        }

    def _get_regla_stock(self, codigo_tipo, tauser):
        """Define las reglas de incremento y decremento de stock."""
        reglas = {
            "ENTCLT": {
                "incrementa": lambda det: StockDivisaTauser.objects.get_or_create(
                    tauser=tauser, denominacion=det["denominacion"], defaults={"stock": 0}
                )[0],
                "decrementa": None,
            },
            "ENTCS": {
                "incrementa": lambda det: StockDivisaTauser.objects.get_or_create(
                    tauser=tauser, denominacion=det["denominacion"], defaults={"stock": 0}
                )[0],
                "decrementa": lambda det: StockDivisaCasa.objects.get(
                    denominacion=det["denominacion"]
                ),
            },
            "SALCLT": {
                "incrementa": None,
                "decrementa": lambda det: StockDivisaTauser.objects.get(
                    tauser=tauser, denominacion=det["denominacion"]
                ),
            },
            "SALCS": {
                "incrementa": lambda det: StockDivisaCasa.objects.get_or_create(
                    denominacion=det["denominacion"], defaults={"stock": 0}
                )[0],
                "decrementa": lambda det: StockDivisaTauser.objects.get(
                    tauser=tauser, denominacion=det["denominacion"]
                ),
            },
        }

        if codigo_tipo not in reglas:
            raise serializers.ValidationError(
                f"Tipo de movimiento '{codigo_tipo}' no reconocido."
            )

        return reglas[codigo_tipo]
    
    def _procesar_detalles(self, movimiento, regla, detalles_data):
        """
        Crea los detalles y actualiza el stock según la regla.
        
        Utiliza actualizaciones atómicas con F() expressions para prevenir race conditions
        y garantizar la integridad del stock en operaciones concurrentes.
        """
        for det in detalles_data:
            denominacion = det["denominacion"]
            cantidad = det["cantidad"]

            MovimientoStockDetalle.objects.create(
                movimiento_stock=movimiento,
                denominacion=denominacion,
                cantidad=cantidad
            )

            # Descontar del origen usando actualización atómica
            if regla["decrementa"]:
                stock_origen = regla["decrementa"](det)
                # Actualización atómica que previene race conditions
                updated = (
                    stock_origen.__class__.objects
                    .filter(id=stock_origen.id, stock__gte=cantidad)
                    .update(stock=F('stock') - cantidad)
                )
                if updated == 0:
                    # Re-consultar para obtener el stock actual
                    raise serializers.ValidationError(
                        f"No hay suficiente stock para la denominación {denominacion}. "
                        f"Stock disponible: {stock_origen.stock}, requerido: {cantidad}"
                    )
                
                stock_origen.refresh_from_db()

            # Sumar al destino usando actualización atómica
            if regla["incrementa"]:
                stock_destino = regla["incrementa"](det)
                # Actualización atómica
                stock_destino.__class__.objects.filter(
                    id=stock_destino.id
                ).update(stock=F('stock') + cantidad)

    def _procesar_salida_cliente(self, movimiento, tauser, transaccion):
        """Calcula las denominaciones automáticamente para una salida al cliente."""
        denominaciones = (
            StockDivisaTauser.objects
            .filter(tauser=tauser, stock__gt=0)
            .select_related("denominacion")
            .order_by("-denominacion__denominacion")
        )

        try:
            monto_restante = Decimal(transaccion.monto_destino)
            monto = monto_restante
            movimiento.monto = monto
            movimiento.save(update_fields=["monto"])
        except Transaccion.DoesNotExist:
            raise serializers.ValidationError(f"No existe la transacción {transaccion}")

        for stock_item in denominaciones:
            valor = stock_item.denominacion.denominacion

            if stock_item.denominacion.divisa.pk != movimiento.divisa.pk:
                continue

            if monto_restante <= 0:
                break

            cantidad_necesaria = int(monto_restante // valor)
            cantidad_a_usar = min(cantidad_necesaria, stock_item.stock)

            if cantidad_a_usar > 0:
                MovimientoStockDetalle.objects.create(
                    movimiento_stock=movimiento,
                    denominacion=stock_item.denominacion,
                    cantidad=cantidad_a_usar
                )

                # Actualización atómica del stock
                updated = (
                    StockDivisaTauser.objects
                    .filter(id=stock_item.pk, stock__gte=cantidad_a_usar)
                    .update(stock=F('stock') - cantidad_a_usar)
                )
                if updated == 0:
                    raise serializers.ValidationError(
                        f"No hay suficiente stock para la denominación {stock_item.denominacion.denominacion}"
                    )
                
                stock_item.refresh_from_db()
                monto_restante -= Decimal(cantidad_a_usar) * valor

        if monto_restante > 0:
            raise serializers.ValidationError(
                f"No hay suficiente stock para cubrir el monto total de {monto}."
            )            
        
