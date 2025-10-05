from decimal import Decimal
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from apps.metodos_financieros.models import MetodoFinanciero, MetodoFinancieroDetalle
from apps.cotizaciones.service import TasaService

def _get_divisa(id_divisa: int) -> Divisa:
    """Obtiene una instancia de Divisa por su ID."""
    return Divisa.objects.get(id=id_divisa)


def _get_metodo_financiero(metodo_id: int) -> MetodoFinanciero:
    """Obtiene un método financiero activo por su ID."""
    return MetodoFinanciero.objects.get(id=metodo_id, is_active=True)

def _get_tasa_activa(divisa: Divisa) -> Tasa:
    """
    Obtiene la tasa activa para una divisa extranjera.
    - Si se pasa la divisa base, lanza un error.
    """
    if divisa.es_base:
        raise ValueError("La tasa solo aplica a divisas extranjeras")
    return Tasa.objects.get(divisa=divisa, activo=True)


def _get_comision_compra(detalle_metodo):
    data = detalle_metodo.get_comision()
    return data.get('comision_compra')

def _get_comision_venta(detalle_metodo):
    data = detalle_metodo.get_comision()
    return data.get('comision_venta')
   


def inferir_op_perspectiva_casa(divisa_origen_id: int, divisa_destino_id: int) -> str:
    """
    Determina el tipo de operación desde la perspectiva del cliente y la casa.
    """

    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)

    if divisa_origen.es_base and not divisa_destino.es_base:
        return "venta"
    elif not divisa_origen.es_base and divisa_destino.es_base:
        return "compra"
    else:
        raise ValueError("La operación debe involucrar siempre la divisa base como origen o destino.")




def calcular_operacion(divisa_origen_id, divisa_destino_id, monto: Decimal, op_perspectiva_casa,
                       detalle_metodo_id=None, metodo_id=None, cliente_id=None):
 
    """
    Simulación para usuario autenticado (con cliente).
    Puede usar una instancia específica (detalle_metodo_id) o un método genérico (metodo_id).
    
    Si usa instancia específica, aplicará comisión del catálogo específico si está habilitada,
    sino usará la comisión por defecto del MetodoFinanciero.
    """


    cliente = None
    if cliente_id:
        cliente = Cliente.objects.get(idCliente=cliente_id)

    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)

    # Determinar el método financiero a usar y la comisión específica
    if detalle_metodo_id:
        detalle = MetodoFinancieroDetalle.objects.select_related(
            'metodo_financiero'
        ).get(id=detalle_metodo_id, cliente=cliente)
        
        metodo = detalle.metodo_financiero
        metodo_nombre = f"{detalle.alias} ({metodo.get_nombre_display()})"
    else:
        metodo = _get_metodo_financiero(metodo_id)
        metodo_nombre = metodo.get_nombre_display()
        detalle = None

    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    



    # Determinar la comisión a usar

  
    if op_perspectiva_casa == "compra":
        com_metodo = _get_comision_compra(detalle) if detalle else metodo.comision_pago_porcentaje
        tc = TasaService.calcular_tasa_compra(tasa, com_metodo, cliente)
        monto_destino = monto * tc
       
    else:
        
        com_metodo = _get_comision_venta(detalle) if detalle else metodo.comision_cobro_porcentaje
        tc = TasaService.calcular_tasa_venta(tasa, com_metodo, cliente)
        monto_destino = monto / tc

    return {
        "op_perspectiva_casa": op_perspectiva_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "nombre_categoria": cliente.id_categoria.nombre if cliente_id else None,
            "descuento_categoria": float(cliente.id_categoria.descuento) if cliente_id else None,
            "nombre_metodo": metodo_nombre,
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2)
    }


# def crear_transaccion_desde_simulacion(operador_id, cliente_id, divisa_origen_id, divisa_destino_id, monto, detalle_metodo_id=None, metodo_id=None, tauser_id=None):
#     """
#     Crea una transacción basada en una simulación de operación.
    
#     Args:
#         operador_id: ID del usuario que opera (request.user)
#         cliente_id: ID del cliente
#         divisa_origen_id: ID de divisa origen
#         divisa_destino_id: ID de divisa destino
#         monto: Monto a convertir
#         detalle_metodo_id: ID del método específico (opcional)
#         metodo_id: ID del método genérico (opcional)
#         tauser_id: ID del terminal de autoservicio
    
#     Returns:
#         Transaccion: Instancia de la transacción creada
#     """
#     from apps.usuarios.models import User
#     from apps.tauser.models import Tauser
    
#     # Obtener datos de la simulación
#     simulacion_data = calcular_operacion(
#         cliente_id, divisa_origen_id, divisa_destino_id, monto, 
#         detalle_metodo_id, metodo_id
#     )
    
#     # Obtener instancias necesarias
#     operador = User.objects.get(id=operador_id)
#     cliente = Cliente.objects.get(idCliente=cliente_id)
#     divisa_origen = _get_divisa(divisa_origen_id)
#     divisa_destino = _get_divisa(divisa_destino_id)
#     tauser = Tauser.objects.get(idTauser=tauser_id)
    
#     # Determinar el método financiero a usar
#     if detalle_metodo_id:
#         detalle_metodo = MetodoFinancieroDetalle.objects.get(id=detalle_metodo_id)
#         metodo_financiero = detalle_metodo.metodo_financiero
#     else:
#         metodo_financiero = _get_metodo_financiero(metodo_id)
    
#     # Crear la transacción
#     from .models import Transaccion
#     transaccion = Transaccion.objects.create(
#         operador=operador,
#         cliente=cliente,
#         operacion=simulacion_data['op_perspectiva_cliente'],
#         tasa_aplicada=simulacion_data['tc_final'],
#         tasa_inicial=simulacion_data['tc_final'],
#         divisa_origen=divisa_origen,
#         divisa_destino=divisa_destino,
#         monto_origen=simulacion_data['monto_origen'],
#         monto_destino=simulacion_data['monto_destino'],
#         metodo_financiero=metodo_financiero,
#         metodo_financiero_detalle=detalle_metodo if detalle_metodo_id else None,
#         tauser=tauser,
#         estado='pendiente'
#     )
    
#     return transaccion






   