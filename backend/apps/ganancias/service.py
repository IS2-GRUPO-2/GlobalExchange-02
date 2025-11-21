"""
Service layer para la gestión de cálculo y registro de ganancias.

Contiene la lógica de negocio para calcular las ganancias generadas
por cada transacción completada, con desglose detallado de componentes.
"""
from decimal import Decimal
from django.db import transaction
from apps.cotizaciones.models import Tasa
from apps.operaciones.models import Transaccion
from .models import Ganancia


class GananciaService:
    """
    Servicio centralizado para cálculo y registro de ganancias.

    Implementa la lógica de negocio para:
    - Calcular ganancia de una transacción específica
    - Desglosar componentes de ganancia (margen, comisión, descuento)
    - Registrar ganancia en la base de datos
    """

    @staticmethod
    def _get_divisa_extranjera(transaccion: Transaccion):
        """Obtiene la divisa extranjera de la transacción."""
        if not transaccion.divisa_origen.es_base:
            return transaccion.divisa_origen
        return transaccion.divisa_destino

    @staticmethod
    def calcular_ganancia_transaccion(transaccion: Transaccion) -> dict:
        """
        Calcula la ganancia completa de una transacción con desglose.

        Args:
            transaccion: Instancia de Transaccion completada

        Returns:
            dict con:
                - ganancia_neta: Ganancia total
                - tasa_mercado: Tasa base del mercado
                - tasa_aplicada: Tasa final al cliente
                - monto_divisa: Monto en divisa extranjera

        Lógica:

        COMPRA (Casa compra divisa extranjera):
        - Cliente entrega: 100 USD
        - Cliente recibe: 725,000 PYG
        - Tasa mercado: 7,300 PYG/USD
        - Tasa aplicada: 7,250 PYG/USD (con descuentos/comisiones)
        - Ganancia = (Tasa Mercado - Tasa Aplicada) * Monto
        - Ganancia = (7,300 - 7,250) * 100 = 5,000 PYG

        La casa paga MENOS de lo que vale la divisa, la diferencia es ganancia.

        VENTA (Casa vende divisa extranjera):
        - Cliente paga: 750,000 PYG
        - Cliente recibe: 100 USD
        - Tasa mercado: 7,300 PYG/USD
        - Tasa aplicada: 7,500 PYG/USD (con descuentos/comisiones)
        - Ganancia = (Tasa Aplicada - Tasa Mercado) * Monto
        - Ganancia = (7,500 - 7,300) * 100 = 20,000 PYG

        La casa cobra MÁS de lo que vale la divisa, la diferencia es ganancia.
        """

        divisa_extranjera = GananciaService._get_divisa_extranjera(transaccion)
        tasa_mercado = transaccion.precio_base
        tasa_aplicada = transaccion.tasa_aplicada

        # Determinar monto en divisa extranjera según operación
        if transaccion.operacion == 'compra':
            # Casa COMPRA: monto_origen es la divisa extranjera que entrega el cliente
            monto_divisa = transaccion.monto_origen
            # Margen = (Tasa Mercado - Tasa Pagada Cliente) * Monto
            margen_unitario = tasa_mercado - tasa_aplicada
        else:  # venta
            # Casa VENDE: monto_destino es la divisa extranjera que recibe el cliente
            monto_divisa = transaccion.monto_destino
            # Margen = (Tasa Cobrada Cliente - Tasa Mercado) * Monto
            margen_unitario = tasa_aplicada - tasa_mercado

        # Ganancia total por la operación
        ganancia_neta = margen_unitario * monto_divisa

        return {
            'ganancia_neta': ganancia_neta,
            'tasa_mercado': tasa_mercado,
            'tasa_aplicada': tasa_aplicada,
            'monto_divisa': monto_divisa,
            'divisa_extranjera': divisa_extranjera,
        }
