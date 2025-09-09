from decimal import Decimal
from apps.cotizaciones.models import Tasa, HistorialTasa
from decimal import Decimal, ROUND_DOWN
from apps.divisas.models import Divisa

class TasaService:

    @staticmethod
    def calcular_tasa_compra(tasa: Tasa) -> Decimal:
        """
        Calcula la tasa de compra final.
        Formula temporal: precioBase - comisionBase
        """
        return Decimal(tasa.precioBase) - Decimal(tasa.comisionBase)

    @staticmethod
    def calcular_tasa_venta(tasa: Tasa) -> Decimal:
        """
        Calcula la tasa de venta final.
        Formula temporal: precioBase + comisionBase
        """
        return Decimal(tasa.precioBase) + Decimal(tasa.comisionBase)
    
    @staticmethod
    def crear_historial(tasa: Tasa) -> HistorialTasa:
        return HistorialTasa.objects.create(
            tasa=tasa,
            tasaCompra=TasaService.calcular_tasa_compra(tasa),
            tasaVenta=TasaService.calcular_tasa_venta(tasa),

        )

