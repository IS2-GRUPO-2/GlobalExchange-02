from apps.clientes.models import Cliente
from apps.divisas.models import Divisa 
from apps.cotizaciones.models import Tasa

def calcular_conversion(cliente_id, divisa_id, monto, metodo_pago, operacion):
    """
    cliente_id: UUID del cliente
    divisa_id: ID de la divisa (no base)
    monto: cantidad ingresada (modo directo)
    metodo_pago: metálico, transferencia, tarjeta... (a futuro → hoy en crudo)
    operacion: "compra" (casa compra divisa extranjera, cliente vende USD)
               "venta" (casa vende divisa extranjera, cliente compra USD)
    """

    # 1. Cliente y descuento
    cliente = Cliente.objects.get(idCliente=cliente_id)
    des_seg = float(cliente.categoria.descuento)  # ahora directo del FK

    # 2. Divisa
    divisa = Divisa.objects.get(id=divisa_id)
    if divisa.es_base:
        return {"error": "No se puede operar con la divisa base directamente"}

    # 3. Tasa
    tasa = Tasa.objects.get(divisa=divisa, activo=True)
    pb_divisa = float(tasa.precioBase)
    com_base = float(tasa.comisionBase)

    #Variables de ajuste (extensibles más adelante con otro modelo)
    # Por ahora en crudo → se reemplazará por tabla "MetodoPago"
    por_com_mp = 0  # RF-42: comisión método de pago
    por_com_mc = 0  # RF-41: comisión método de cobro

    # 4. Cálculo según operación
    if operacion == "compra":  
        # Casa COMPRA divisa extranjera (cliente VENDE USD → recibe PYG)
        tc_comp = pb_divisa * (1 - por_com_mp/100) - com_base * (1 - des_seg/100)
        monto_destino = monto * tc_comp

        return {
            "operacion": "casa compra divisa",
            "divisa": divisa.codigo,
            "parametros": {
                "precio_base": pb_divisa,
                "comision_base": com_base,
                "descuento_categoria": des_seg,
                "porcentaje_metodo_pago": por_com_mp,
            },
            "tc_final": round(tc_comp, 4),
            "monto_origen": monto,
            "monto_destino": round(monto_destino, 2),
            "unidad_destino": "PYG"
        }

    elif operacion == "venta":  
        # Casa VENDE divisa extranjera (cliente COMPRA USD → paga PYG)
        tc_vta = pb_divisa * (1 + por_com_mc/100) + com_base * (1 - des_seg/100)
        monto_destino = monto / tc_vta

        return {
            "operacion": "casa vende divisa",
            "divisa": divisa.codigo,
            "parametros": {
                "precio_base": pb_divisa,
                "comision_base": com_base,
                "descuento_categoria": des_seg,
                "porcentaje_metodo_cobro": por_com_mc,
            },
            "tc_final": round(tc_vta, 4),
            "monto_origen": monto,
            "monto_destino": round(monto_destino, 2),
            "unidad_destino": divisa.codigo
        }

    return {"error": "Operación no soportada"}