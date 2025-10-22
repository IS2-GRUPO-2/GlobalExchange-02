from factura_base import factura_base
from models import FacturaSettings
from apps.operaciones.models import Transaccion
from django.core.exceptions import ValidationError

from datetime import datetime

def cargar_datos_factura(transaccion_id):
    try:
        transaccion = Transaccion.objects.get(pk=transaccion_id)
    except Transaccion.DoesNotExist:
        raise ValidationError("La transaccion no existe")
    
    divisa_origen = transaccion.divisa_origen

    if divisa_origen.codigo not in ["PYG", "USD"]:
        raise ValidationError("No se hacen facturas que no sean en PYG o USD")

    cliente = transaccion.cliente
    metodo_pago = transaccion.metodo_financiero
    if metodo_pago is None:
        raise ValidationError("La transaccion no tiene un metodo de pago asociado")
    settings = FacturaSettings.get_solo()
    num_doc = settings.siguiente_num()
    factura = factura_base
    factura["dNumDoc"] = "0000" + str(num_doc)
    factura["dFeEmiDE"] = datetime.now().isoformat().split('.')[0]
    factura["iTipTra"] = "4" if transaccion.operacion == "venta" else "6"
    factura["iNatRec"] = "1" if cliente.ruc is not None else "2"
    factura["iTiOpe"] = "2" if cliente.is_persona_fisica else "1"
    
    if cliente.ruc is not None:
        factura["iTiContRec"] = "1"
        factura["dRucRec"] = cliente.ruc.split('-')[0]
        factura["dDVRec"] = cliente.ruc.split('-')[1]
    else:
        factura["iTiContRec"] = "2"
        factura["iTipIDRec"] = "1"
        factura["dNumIDRec"] = cliente.cedula

    factura["dNomRec"] = cliente.nombre
    factura["dEmailRec"] = cliente.correo
    
    pago = {
        "iTiPago": "1",
        "dMonTiPag": str(transaccion.monto_origen),
        "dMoneTiPag": divisa_origen.codigo,
        "dTiCamTiPag": "1" if divisa_origen.es_base else str(transaccion.tasa_aplicada)
    }

    if metodo_pago.nombre in ["TARJETA", "STRIPE"]:
        pago["iTiPago"] = "3"
            
