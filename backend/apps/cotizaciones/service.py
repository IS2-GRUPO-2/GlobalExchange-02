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
    def calcular_tasa_compra(tasa: Tasa, com_metodo: Decimal=None, cliente: Cliente=None) -> Decimal:
        """
        Calcula la tasa de compra final
        """
        precio_base = Decimal(tasa.precioBase)
        comision_base = Decimal(tasa.comisionBaseCompra)
        if cliente:
            categ_descuento = Decimal(cliente.idCategoria.descuento)
        else:
            categ_descuento = Decimal(0)

        if com_metodo:
            com_metodo = Decimal(com_metodo)
        else:
            com_metodo = Decimal(0)

        return (
            precio_base * (1 - com_metodo / 100) - comision_base * (1 - categ_descuento / 100)
        )
    
    @staticmethod
    def calcular_tasa_venta(tasa: Tasa, com_metodo: Decimal=None, cliente: Cliente=None) -> Decimal:
        """
        Calcula la tasa de venta final
        """
        precio_base = Decimal(tasa.precioBase)
        comision_base = Decimal(tasa.comisionBaseVenta)

        if cliente:
            categ_descuento = Decimal(cliente.idCategoria.descuento)
        else:
            categ_descuento = Decimal(0)

        if com_metodo:
            com_metodo = Decimal(com_metodo)
        else:
            com_metodo = Decimal(0)

        return (
            precio_base * (1 + com_metodo / 100) + comision_base * (1 - categ_descuento / 100)
        )

