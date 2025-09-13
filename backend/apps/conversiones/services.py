"""
Módulo de servicios para la aplicación de simulación de conversiones de divisas.
Contiene la lógica de negocio central (sin depender de vistas ni serializers).
"""

from decimal import Decimal
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa 
from apps.cotizaciones.models import Tasa
from apps.operaciones.models import MetodoFinanciero



def _get_divisa(id_divisa):
    """Obtiene una instancia de Divisa por su ID."""
    return Divisa.objects.get(id=id_divisa)


def _get_metodo(metodo_id):
    """Obtiene un método financiero activo por su ID."""
    return MetodoFinanciero.objects.get(id=metodo_id, is_active=True)


def _inferir_operacion(divisa_origen, divisa_destino):
    """
    Determina el tipo de operación desde la perspectiva del cliente y la casa.

    Reglas:
    - Si el origen es la divisa base → cliente COMPRA divisa extranjera / casa VENDE.
    - Si el origen es una divisa extranjera → cliente VENDE / casa COMPRA.
    """
    if divisa_origen.es_base and not divisa_destino.es_base:
        return "compra", "venta"
    elif not divisa_origen.es_base and divisa_destino.es_base:
        return "venta", "compra"
    else:
        raise ValueError("La operación debe involucrar siempre la divisa base como origen o destino.")




def _get_tasa_activa(divisa):
    """
    Obtiene la tasa activa para una divisa extranjera.
    - Si se pasa la divisa base, lanza un error.
    """
    if divisa.es_base:
        raise ValueError("La tasa solo aplica a divisas extranjeras")
    return Tasa.objects.get(divisa=divisa, activo=True)


def aplicar_descuento(comision_base, descuento_categoria):
    """Aplica un descuento porcentual a la comisión base."""
    return comision_base * (1 - descuento_categoria / 100)


def calcular_conversion(cliente_id, divisa_origen_id, divisa_destino_id, monto, metodo_id):
    """
    Simulación para usuario autenticado (con cliente asociado).
    Aplica descuentos por categoría y comisiones personalizadas.

    Args:
        cliente_id: UUID del cliente
        divisa_origen_id: ID de la divisa origen
        divisa_destino_id: ID de la divisa destino
        monto: cantidad a convertir
        metodo_id: ID del método financiero

    Returns:
        dict con detalles de la conversión (operaciones, parámetros, tasa, montos, método)
    """
    monto = Decimal(monto)
    cliente = Cliente.objects.get(idCliente=cliente_id)
    des_seg = Decimal(cliente.idCategoria.descuento)

    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)
    metodo = _get_metodo(metodo_id)

    operacion_cliente, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)

    # La divisa extranjera siempre será la que NO es base
    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    pb_divisa = Decimal(tasa.precioBase)
    com_base = Decimal(tasa.comisionBase)

    if operacion_casa == "compra":
        # Casa COMPRA divisa extranjera → cliente vende
        por_com_mp = Decimal(metodo.comision_pago_porcentaje)
        tc_comp = pb_divisa * (1 - por_com_mp/100) - aplicar_descuento(com_base, des_seg)
        monto_destino = monto * tc_comp

        return {
            "operacion_cliente": operacion_cliente,
            "operacion_casa": operacion_casa,
            "divisa_origen": divisa_origen.codigo,
            "divisa_destino": divisa_destino.codigo,
            "parametros": {
                "precio_base": float(pb_divisa),
                "comision_base": float(com_base),
                "descuento_categoria": float(des_seg),
                "comision_metodo": float(por_com_mp),
            },
            "tc_final": round(tc_comp, 4),
            "monto_origen": float(monto),
            "monto_destino": round(monto_destino, 2),
            "metodo": metodo.get_nombre_display()
        }

    elif operacion_casa == "venta":
        # Casa VENDE divisa extranjera → cliente compra
        por_com_mc = Decimal(metodo.comision_cobro_porcentaje)
        tc_vta = pb_divisa * (1 + por_com_mc/100) + aplicar_descuento(com_base, des_seg)
        monto_destino = monto / tc_vta

        return {
            "operacion_cliente": operacion_cliente,
            "operacion_casa": operacion_casa,
            "divisa_origen": divisa_origen.codigo,
            "divisa_destino": divisa_destino.codigo,
            "parametros": {
                "precio_base": float(pb_divisa),
                "comision_base": float(com_base),
                "descuento_categoria": float(des_seg),
                "comision_metodo": float(por_com_mc),
            },
            "tc_final": round(tc_vta, 4),
            "monto_origen": float(monto),
            "monto_destino": round(monto_destino, 2),
            "metodo": metodo.get_nombre_display()
        }


def calcular_conversion_publica(divisa_origen_id, divisa_destino_id, monto, metodo_id):
    """
    Simulación para usuario invitado (landing page).
    Usa tasas actuales y comisiones base, sin descuentos por cliente.

    Args:
        divisa_origen_id: ID de la divisa origen
        divisa_destino_id: ID de la divisa destino
        monto: cantidad a convertir
        metodo_id: ID del método financiero

    Returns:
        dict con detalles de la conversión pública
    """
     
    monto = Decimal(monto)
    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)
    metodo = _get_metodo(metodo_id)

    operacion_cliente, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)

    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    pb_divisa = Decimal(tasa.precioBase)
    com_base = Decimal(tasa.comisionBase)

    

    if operacion_casa == "venta":
        por_com_mc = Decimal(metodo.comision_cobro_porcentaje)
        tc_vta = pb_divisa * (1 + por_com_mc/100) + com_base
        monto_destino = monto / tc_vta

        return {
            "operacion_cliente": operacion_cliente,
            "operacion_casa": operacion_casa,
            "divisa_origen": divisa_origen.codigo,
            "divisa_destino": divisa_destino.codigo,
            "parametros": {
                "precio_base": float(pb_divisa),
                "comision_base": float(com_base),
                "comision_metodo": float(por_com_mc),
            },
            "tc_final": round(tc_vta, 4),
            "monto_origen": float(monto),
            "monto_destino": round(monto_destino, 2),
            "metodo": metodo.get_nombre_display()
        }


    elif operacion_casa == "compra":
        por_com_mp = Decimal(metodo.comision_pago_porcentaje)
        tc_comp = pb_divisa * (1 - por_com_mp / 100) - com_base
        monto_destino = monto * tc_comp

        return {
            "operacion_cliente": operacion_cliente,
            "operacion_casa": operacion_casa,
            "divisa_origen": divisa_origen.codigo,
            "divisa_destino": divisa_destino.codigo,
            "parametros": {
                "precio_base": float(pb_divisa),
                "comision_base": float(com_base),
                "comision_metodo": float(por_com_mp),
            },
            "tc_final": round(tc_comp, 4),
            "monto_origen": float(monto),
            "monto_destino": round(monto_destino, 2),
            "metodo": metodo.get_nombre_display()
        }







def listar_metodos_por_divisas(divisa_origen_id, divisa_destino_id):
    """
    Dada una combinación de divisas, infiere la operación de la casa
    y devuelve los métodos financieros válidos para esa operación.

    Args:
        divisa_origen_id: ID de la divisa origen
        divisa_destino_id: ID de la divisa destino

    Returns:
        tuple (operacion_casa, queryset de métodos financieros)
    """
    divisa_origen = Divisa.objects.get(id=divisa_origen_id)
    divisa_destino = Divisa.objects.get(id=divisa_destino_id)

    # Usamos la lógica centralizada
    _, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)

    if operacion_casa == "compra":
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_pago=True)
    elif operacion_casa == "venta":
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_cobro=True)
    else:
        raise ValueError("Operación inválida")

    return operacion_casa, metodos
