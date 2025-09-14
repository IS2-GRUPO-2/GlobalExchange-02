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
    - Con cliente (aplica descuento) o pública (sin descuento)
    """

    @staticmethod
    def calcular_tasa_compra(tasa: Tasa) -> Decimal:
        """
        Calcula la tasa de compra final.
        Formula temporal: precioBase - comisionBase
        """
        return Decimal(tasa.precioBase) - Decimal(tasa.comisionBaseCompra)

    @staticmethod
    def calcular_tasa_venta(tasa: Tasa) -> Decimal:
        """
        Calcula la tasa de venta final.
        Formula temporal: precioBase + comisionBase
        """
        return Decimal(tasa.precioBase) + Decimal(tasa.comisionBaseVenta)
    
    @staticmethod
    def crear_historial(tasa: Tasa) -> HistorialTasa:
        return HistorialTasa.objects.create(
            tasa=tasa,
            tasaCompra=TasaService.calcular_tasa_compra(tasa),
            tasaVenta=TasaService.calcular_tasa_venta(tasa),

        )
    
     # --------------------------------
    #   CON CLIENTE (aplica descuento)
    # --------------------------------
    @staticmethod
    def calcular_tasa_venta_metodoPago_cliente(tasa: Tasa, metodo: MetodoFinanciero, cliente: Cliente) -> Decimal:
        """
        Calcula la tasa de venta considerando método y descuento de cliente.
        Formula: precioBase * (1 + comision_cobro/100) + comisionBaseVenta * (1 - descuento/100)
        """
        return (
            Decimal(tasa.precioBase) * (1 + Decimal(metodo.comision_cobro_porcentaje) / 100)
            + Decimal(tasa.comisionBaseVenta) * (1 - Decimal(cliente.idCategoria.descuento) / 100)
        )

    @staticmethod
    def calcular_tasa_compra_metodoPago_cliente(tasa: Tasa, metodo: MetodoFinanciero, cliente: Cliente) -> Decimal:
        """
        Calcula la tasa de compra considerando método y descuento de cliente.
        Formula: precioBase * (1 + comision_pago/100) + comisionBaseCompra * (1 - descuento/100)
        """
        return (
            Decimal(tasa.precioBase) * (1 + Decimal(metodo.comision_pago_porcentaje) / 100)
            + Decimal(tasa.comisionBaseCompra) * (1 - Decimal(cliente.idCategoria.descuento) / 100)
        )

    # -------------------------
    #   PÚBLICA (sin cliente)
    # -----
    @staticmethod
    def calcular_tasa_venta_metodoPago(tasa: Tasa, metodo: MetodoFinanciero) -> Decimal:
        """
        Calcula la tasa de venta considerando el método de cobro.
        Formula: precioBase * (1 + comision_cobro/100) + comisionBaseVenta
        """
        return (
            Decimal(tasa.precioBase) * (1 + Decimal(metodo.comision_cobro_porcentaje) / 100)
            + Decimal(tasa.comisionBaseVenta)
        )

    @staticmethod
    def calcular_tasa_compra_metodoPago(tasa: Tasa, metodo: MetodoFinanciero) -> Decimal:
        """
        Calcula la tasa de compra considerando el método de pago.
        Formula: precioBase * (1 + comision_pago/100) + comisionBaseCompra
        """
        return (
            Decimal(tasa.precioBase) * (1 + Decimal(metodo.comision_pago_porcentaje) / 100)
            + Decimal(tasa.comisionBaseCompra)
        )

