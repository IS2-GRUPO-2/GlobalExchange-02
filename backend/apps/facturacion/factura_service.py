from .factura_base import factura_base
from .models import FacturaSettings
from apps.operaciones.models import Transaccion, PagoStripe
from django.core.exceptions import ValidationError
from apps.metodos_financieros.models import Tarjeta, Cheque
import json
import requests
from globalexchange.configuration import config
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

BRANDS = {
    "visa": "1",
    "mastercard": "2",
    "American Express": "3",
    "Cabal": "6"
}

PAGO_ONLINE = ["STRIPE", "TARJETA", "TRANSFERENCIA_BANCARIA", "BILLETERA_DIGITAL"]

def cargar_datos_factura(transaccion_id):
    transaccion = _cargar_transaccion(transaccion_id)
    
    factura = _cargar_datos_iniciales(transaccion)
    
    _cargar_datos_cliente(transaccion, factura)

    _cargar_datos_pago(transaccion, factura)

    _cargar_item_factura(transaccion, factura)

    return factura


def _cargar_transaccion(transaccion_id) -> Transaccion:
    try:
        transaccion = Transaccion.objects.get(pk=transaccion_id)
    except Transaccion.DoesNotExist:
        raise ValidationError("La transaccion no existe")
    
    if transaccion.estado not in ["en_proceso", "completada"]:
        raise ValidationError("No se pueden factura transacciones que aun no hayan sido pagadas")

    if transaccion.metodo_financiero is None:
        raise ValidationError("La transaccion no tiene metodo de pago")

    if transaccion.metodo_financiero_detalle is None:
        if transaccion.metodo_financiero.nombre not in ["STRIPE", "EFECTIVO", "CHEQUE"]: # type: ignore
            raise ValidationError("No hay metodo de pago asociado")

    return transaccion

def _cargar_datos_iniciales(transaccion: Transaccion):
    factura = factura_base.copy()
    settings = FacturaSettings.get_solo()
    num_doc = settings.siguiente_num()
    utc_minus_3 = timezone(timedelta(hours=-3))
    factura["dNumDoc"] = "0000" + str(num_doc)
    factura["dFeEmiDE"] = datetime.now(utc_minus_3).isoformat().split('.')[0]
    factura["iTipTra"] = "5" if transaccion.operacion == "venta" else "6"

    return factura

def _cargar_datos_cliente(transaccion: Transaccion, factura: dict):
    cliente = transaccion.cliente

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

def _cargar_datos_stripe(transaccion: Transaccion, pago: dict):
    try:
        data_pago = PagoStripe.objects.get(transaccion=transaccion)
    except PagoStripe.DoesNotExist:
        raise ValidationError("No existe informacion de pago con stripe para esta transaccion")
    pago["iTiPago"] = "3" if data_pago.funding == "credit" else "4"
    pago["iDenTarj"] = "99" if data_pago.brand not in BRANDS else BRANDS[data_pago.brand]
    pago["iForProPa"] = "2"

def _cargar_datos_tarjeta(transaccion: Transaccion, pago: dict):
    metodo_pago_detalle = transaccion.metodo_financiero_detalle

    try:
        tarjeta = Tarjeta.objects.get(metodo_financiero_detalle=metodo_pago_detalle)
    except Tarjeta.DoesNotExist:
        raise ValidationError("No existe tarjeta con metodo_financiero_detalle " + str(metodo_pago_detalle))
    marca = tarjeta.brand if tarjeta.brand is not None else "other"
    
    pago["iTiPago"] = "3"
    pago["iDenTarj"] = "99" if marca not in BRANDS else BRANDS[marca]
    pago["iForProPa"] = "2"

def _cargar_datos_cheque(transaccion: Transaccion, pago: dict):
    """Carga datos específicos cuando el pago es con CHEQUE.
    Busca el cheque asociado a la transacción. Intenta primero por la FK directa
    y, si no está, por el texto en observaciones con el patrón "Transaccion <id>".
    """
    # Tipo de pago 2 = Cheque
    pago["iTiPago"] = "2"
    cheque = None
    # Preferir relación directa si existe
    try:
        cheque = Cheque.objects.filter(transaccion=transaccion).first()
    except Exception:
        cheque = None
    if not cheque:
        raise ValidationError("No se encontró un cheque asociado a la transacción")
    numero = str(cheque.numero) if cheque.numero is not None else ""
    # Debe ser de 8 caracteres, padding con ceros a la izquierda
    pago["dNumCheq"] = numero.zfill(8)[:8]
    pago["dBcoEmi"] = cheque.banco_emisor.nombre if cheque.banco_emisor else ""

def _cargar_datos_pago(transaccion: Transaccion, factura: dict):
    metodo_pago = transaccion.metodo_financiero
    pago = {
        "iTiPago": "1",
        "dMonTiPag": str(transaccion.monto_origen),
        "dMoneTiPag": transaccion.divisa_origen.codigo,
        "dTiCamTiPag": "1" if transaccion.divisa_origen.es_base else str(transaccion.tasa_aplicada)
    }

    pago_online = metodo_pago.nombre in PAGO_ONLINE # type: ignore
    factura["iIndPres"] = "2" if pago_online else "1"

    match metodo_pago.nombre: # type: ignore
        case "STRIPE":
            _cargar_datos_stripe(transaccion, pago)
        case "TARJETA":
            _cargar_datos_tarjeta(transaccion, pago)
        case "TRANSFERENCIA_BANCARIA":
            pago["iTiPago"] = "5"
        case "CHEQUE":
            _cargar_datos_cheque(transaccion, pago)
        case "BILLETERA_DIGITAL":
            pago["iTiPago"] = "7"     
        case _:
            raise ValidationError("El metodo de pago aun no puede ser facturado")

    factura["gPaConEIni"] = [pago]         
    
def _cargar_item_factura(transaccion: Transaccion, factura: dict):
    item = {}
    item["dCodInt"] = transaccion.divisa_destino.codigo
    item["dDesProSer"] = "Operación en " + transaccion.divisa_destino.nombre
    item["cUniMed"] = "77"
    item["dPUniProSer"] = str(transaccion.monto_origen)
    item["dCantProSer"] = "1"
    item["dDescItem"] = "0"
    item["dDescGloItem"] = "0"
    item["dAntPreUniIt"] = "0"
    item["dAntGloPreUniIt"] = "0"
    item["iAfecIVA"] = "2"
    item["dPropIVA"] = "0"
    item["dTasaIVA"] = "0"

    factura["gCamItem"] = [item]


def calcular_factura(factura: Dict[str, Any]) -> Dict[str, Any]:
    """
    Envía la factura al servicio de facturación para su cálculo y validación.
    
    Args:
        factura (Dict[str, Any]): Diccionario con los datos de la factura a calcular
        
    Returns:
        Dict[str, Any]: Respuesta del servicio de facturación
        
    Raises:
        ValidationError: Si hay errores en la factura o en la comunicación con el servicio
    """
    url = f"{config.FACTURA_SEGURA_URL}/misife00/v1/esi"
    headers = {
        'Authentication-Token': config.FACTURASEGURA_API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        "operation": "calcular_de",
        "params": {
            "DE": factura
        }
    }

    print(payload)
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Lanza una excepción para códigos de estado HTTP >= 400
        data = response.json()
        print(data)
        if data.get('code') != 0:  # Si hay un error en la respuesta
            error_msg = f"Error al calcular factura: {data.get('description', 'Error desconocido')}"
            if data.get('operation_info', {}).get('id'):
                error_msg += f" (Operation ID: {data['operation_info']['id']})"
            raise ValidationError(error_msg)
            
        return data
        
    except requests.RequestException as e:
        raise ValidationError(f"Error de comunicación con el servicio de facturación: {str(e)}")
    except json.JSONDecodeError:
        raise ValidationError("Error al procesar la respuesta del servicio de facturación")
        
def generar_factura(factura: Dict[str, Any]) -> str:
    """
    Genera una factura electrónica usando el DE calculado previamente.
    
    Args:
        factura (Dict[str, Any]): Diccionario con el DE calculado y validado
        
    Returns:
        str: El CDC (Código de Control) de la factura generada
        
    Raises:
        ValidationError: Si hay errores al generar la factura o en la comunicación
    """
    url = f"{config.FACTURA_SEGURA_URL}/misife00/v1/esi"
    headers = {
        'Authentication-Token': config.FACTURASEGURA_API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        "operation": "generar_de",
        "params": {
            "DE": factura
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        if data.get('code') != 0:
            error_msg = f"Error al generar factura: {data.get('description', 'Error desconocido')}"
            if data.get('results') and data['results'][0].get('Exception'):
                error_msg += f"\nDetalle: {data['results'][0]['Exception']}"
            if data.get('operation_info', {}).get('id'):
                error_msg += f" (Operation ID: {data['operation_info']['id']})"
            raise ValidationError(error_msg)
        
        # Extraemos el CDC de la respuesta
        if not data.get('results') or not data['results'][0].get('CDC'):
            raise ValidationError("No se recibió el CDC de la factura generada")
            
        return data['results'][0]['CDC']
        
    except requests.RequestException as e:
        raise ValidationError(f"Error de comunicación con el servicio de facturación: {str(e)}")
    except json.JSONDecodeError:
        raise ValidationError("Error al procesar la respuesta del servicio de facturación")
