from rest_framework import serializers
from .models import TipoMovimiento, MovimientoStock, MovimientoStockDetalle, StockDivisaCasa, StockDivisaTauser
from django.db import transaction
from apps.divisas.models import Denominacion
from decimal import Decimal

class TipoMovimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMovimiento
        fields = '__all__'

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
    class Meta:
        model = MovimientoStockDetalle
        fields = '__all__'
class MovimientoStockSerializer(serializers.ModelSerializer):
    detalles = MovimientoStockDetalleCreateSerializer(many=True, required=False)
    detalles_info = MovimientoStockDetalleSerializer(
        many=True,
        read_only=True,
        source="movimientostockdetalle_set"
    )


    class Meta:
        model = MovimientoStock
        fields = '__all__'
        
    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop("detalles", [])
        tipo_mov = validated_data["tipo_movimiento"]
        codigo_tipo = tipo_mov.codigo.upper()
        tauser = validated_data["tauser"]
        monto = validated_data["monto"]

        movimiento = MovimientoStock.objects.create(**validated_data)
        regla = self._get_regla_stock(codigo_tipo, tauser)

        if codigo_tipo == "SALCLT":
            self._procesar_salida_cliente(movimiento, tauser, monto)
        else:
            self._procesar_detalles(movimiento, regla, detalles_data)

        return movimiento
    
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
        """Crea los detalles y actualiza el stock según la regla."""
        for det in detalles_data:
            denominacion = det["denominacion"]
            cantidad = det["cantidad"]

            MovimientoStockDetalle.objects.create(
                movimiento_stock=movimiento,
                denominacion=denominacion,
                cantidad=cantidad
            )

            # Descontar del origen
            if regla["decrementa"]:
                stock_origen = regla["decrementa"](det)
                if stock_origen.stock < cantidad:
                    raise serializers.ValidationError(
                        f"No hay suficiente stock para la denominación {denominacion}"
                    )
                stock_origen.stock -= cantidad
                stock_origen.save(update_fields=["stock"])

            # Sumar al destino
            if regla["incrementa"]:
                stock_destino = regla["incrementa"](det)
                stock_destino.stock += cantidad
                stock_destino.save(update_fields=["stock"])

    def _procesar_salida_cliente(self, movimiento, tauser, monto):
        """Calcula las denominaciones automáticamente para una salida al cliente."""
        monto_restante = Decimal(monto)
        denominaciones = (
            StockDivisaTauser.objects
            .filter(tauser=tauser, stock__gt=0)
            .select_related("denominacion")
            .order_by("-denominacion__denominacion")
        )

        for stock_item in denominaciones:
            valor = stock_item.denominacion.denominacion
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

                stock_item.stock -= cantidad_a_usar
                stock_item.save(update_fields=["stock"])
                monto_restante -= Decimal(cantidad_a_usar) * valor

        if monto_restante > 0:
            raise serializers.ValidationError(
                f"No hay suficiente stock para cubrir el monto total de {monto}."
            )            
        