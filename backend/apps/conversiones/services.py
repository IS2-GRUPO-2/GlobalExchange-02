from decimal import Decimal
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from apps.operaciones.models import MetodoFinanciero
from apps.cotizaciones.service import TasaService

def _get_divisa(id_divisa: int) -> Divisa:
    """Obtiene una instancia de Divisa por su ID."""
    return Divisa.objects.get(id=id_divisa)


def _get_metodo(metodo_id: int) -> MetodoFinanciero:
    """Obtiene un método financiero activo por su ID."""
    return MetodoFinanciero.objects.get(id=metodo_id, is_active=True)


def _inferir_operacion(divisa_origen: Divisa, divisa_destino: Divisa) -> tuple:
    """
    Determina el tipo de operación desde la perspectiva del cliente y la casa.
    """
    if divisa_origen.es_base and not divisa_destino.es_base:
        return "compra", "venta"
    elif not divisa_origen.es_base and divisa_destino.es_base:
        return "venta", "compra"
    else:
        raise ValueError("La operación debe involucrar siempre la divisa base como origen o destino.")


def _get_tasa_activa(divisa: Divisa) -> Tasa:
    """
    Obtiene la tasa activa para una divisa extranjera.
    - Si se pasa la divisa base, lanza un error.
    """
    if divisa.es_base:
        raise ValueError("La tasa solo aplica a divisas extranjeras")
    return Tasa.objects.get(divisa=divisa, activo=True)


def aplicar_descuento(monto: Decimal, descuento_porcentaje: Decimal) -> Decimal:
    """
    Aplica un descuento porcentual a un monto.
    
    Args:
        monto: Monto base al cual aplicar el descuento
        descuento_porcentaje: Porcentaje de descuento (ej: 10 para 10%)
    
    Returns:
        Monto con descuento aplicado
    """
    descuento_decimal = descuento_porcentaje / Decimal('100')
    descuento_monto = monto * descuento_decimal
    return monto - descuento_monto


def calcular_conversion(cliente_id, divisa_origen_id, divisa_destino_id, monto, metodo_id):
    """
    Simulación para usuario autenticado (con cliente).
    Aplica descuentos de categoría + comisiones personalizadas.
    """
    monto = Decimal(monto)
    cliente = Cliente.objects.get(idCliente=cliente_id)

    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)
    metodo = _get_metodo(metodo_id)

    operacion_cliente, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)
    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    if operacion_casa == "compra":
        # Casa COMPRA → Cliente vende
        tc = TasaService.calcular_tasa_compra_metodoPago_cliente(tasa, metodo, cliente)
        monto_destino = monto * tc
        com_base = tasa.comisionBaseCompra
        com_metodo = metodo.comision_pago_porcentaje
    else:
        # Casa VENDE → Cliente compra
        tc = TasaService.calcular_tasa_venta_metodoPago_cliente(tasa, metodo, cliente)
        monto_destino = monto / tc
        com_base = tasa.comisionBaseVenta
        com_metodo = metodo.comision_cobro_porcentaje

    return {
        "operacion_cliente": operacion_cliente,
        "operacion_casa": operacion_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "precio_base": float(tasa.precioBase),
            "comision_base": float(com_base),
            "descuento_categoria": float(cliente.idCategoria.descuento),
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2),
        "metodo": metodo.get_nombre_display(),
    }


def calcular_conversion_publica(divisa_origen_id, divisa_destino_id, monto, metodo_id):
    """
    Simulación pública (landing).
    Usa tasas actuales + comisiones base. No aplica descuento de cliente.
    """
    monto = Decimal(monto)
    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)
    metodo = _get_metodo(metodo_id)

    operacion_cliente, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)
    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    if operacion_casa == "compra":
        # Casa COMPRA → Cliente vende
        tc = TasaService.calcular_tasa_compra_metodoPago(tasa, metodo)
        monto_destino = monto * tc
        com_base = tasa.comisionBaseCompra
        com_metodo = metodo.comision_pago_porcentaje
    else:
        # Casa VENDE → Cliente compra
        tc = TasaService.calcular_tasa_venta_metodoPago(tasa, metodo)
        monto_destino = monto / tc
        com_base = tasa.comisionBaseVenta
        com_metodo = metodo.comision_cobro_porcentaje

    return {
        "operacion_cliente": operacion_cliente,
        "operacion_casa": operacion_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "precio_base": float(tasa.precioBase),
            "comision_base": float(com_base),
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2),
        "metodo": metodo.get_nombre_display(),
    }


def listar_metodos_por_divisas(divisa_origen_id, divisa_destino_id):
    """
    Dada una combinación de divisas, infiere la operación de la casa
    y devuelve los métodos financieros válidos para esa operación.
    """
    divisa_origen = Divisa.objects.get(id=divisa_origen_id)
    divisa_destino = Divisa.objects.get(id=divisa_destino_id)

    _, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)

    if operacion_casa == "compra":
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_pago=True)
    elif operacion_casa == "venta":
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_cobro=True)
    else:
        raise ValueError("Operación inválida")

    return operacion_casa, metodos
