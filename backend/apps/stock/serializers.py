from rest_framework import serializers
from .models import TipoMovimiento, MovimientoStock, MovimientoStockDetalle, StockDivisaCasa, StockDivisaTauser
from django.db import transaction
from apps.divisas.models import Denominacion
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
        
class MovimientoStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoStock
        fields = '__all__'
        
    @transaction.atomic
    def create(self, validated_data):
        divisa = validated_data['divisa'] 
        monto = validated_data['monto']
        tauser = validated_data['tauser']
        
        movimiento = MovimientoStock.objects.create(**validated_data)
        
        stocks = (
            StockDivisaTauser.objects
            .filter(tauser=tauser, denominacion__divisa_id=divisa)
            .select_related('denominacion')
            .order_by('-denominacion__denominacion')  # de mayor a menor denominación
        )
        
        monto_restante = monto
        detalles_creados = []
        
        for stock in stocks:
            valor = stock.denominacion.denominacion
            disponible = stock.stock

            if disponible <= 0 or valor <= 0:
                continue
            
            cantidad_necesaria = int(monto_restante // valor)
            cantidad_a_usar = min(cantidad_necesaria, disponible)

            if cantidad_a_usar > 0:
                MovimientoStockDetalle.objects.create(
                    movimiento_stock=movimiento,
                    denominacion=stock.denominacion,
                    cantidad=cantidad_a_usar
                )

                # Restar del stock del tauser
                stock.stock -= cantidad_a_usar
                stock.save(update_fields=['stock'])

                # Restar del monto restante
                monto_restante -= cantidad_a_usar * valor

                detalles_creados.append({
                    "denominacion": stock.denominacion.denominacion,
                    "cantidad": cantidad_a_usar
                })

            if monto_restante <= 0:
                break

        if monto_restante > 0:
            raise serializers.ValidationError(
                f"No hay suficiente stock disponible para cubrir el monto ({monto_restante} restante)."
            )

        return movimiento
        
class MovimientoStockDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoStockDetalle
        fields = '__all__'