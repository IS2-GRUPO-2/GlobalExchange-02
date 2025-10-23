from decimal import Decimal
from apps.cotizaciones.models import Tasa, HistorialTasa
from decimal import Decimal, ROUND_DOWN
from apps.divisas.models import Divisa
from apps.operaciones.models import MetodoFinanciero
from apps.clientes.models import Cliente


class TasaService:
    """
    Servicio central de cálculo de tasas de cambio.
    Contiene métodos estáticos para calcular tasas en distintos contextos:
    - Venta / Compra
    """

    @staticmethod
    def crear_historial(tasa: Tasa) -> HistorialTasa:
        return HistorialTasa.objects.create(
            tasa=tasa,
            tasaCompra=TasaService.calcular_tasa_compra(tasa),
            tasaVenta=TasaService.calcular_tasa_venta(tasa),

        )

    @staticmethod
    def calcular_tasa_compra(tasa: Tasa, com_metodo: Decimal = None, cliente: Cliente = None) -> Decimal:
        """
        Calcula la tasa de compra final
        """
        precio_base = tasa.precioBase
        comision_base = tasa.comisionBaseCompra

        tasa_compra = precio_base - comision_base

        if cliente:
            categ_descuento = cliente.id_categoria.descuento / Decimal('100')
            tasa_compra = tasa_compra + tasa_compra * categ_descuento

        if com_metodo:
            com_metodo = com_metodo / Decimal('100')
            tasa_compra = tasa_compra - tasa_compra * com_metodo

        return tasa_compra

    @staticmethod
    def calcular_tasa_venta(tasa: Tasa, com_metodo: Decimal = None, cliente: Cliente = None) -> Decimal:
        """
        Calcula la tasa de venta final
        """
        precio_base = tasa.precioBase
        comision_base = tasa.comisionBaseVenta

        tasa_venta = precio_base + comision_base

        if cliente:
            categ_descuento = cliente.id_categoria.descuento / Decimal('100')
            tasa_venta = tasa_venta - tasa_venta * categ_descuento

        if com_metodo:
            com_metodo = com_metodo / Decimal('100')
            tasa_venta = tasa_venta + tasa_venta * com_metodo

        return tasa_venta
