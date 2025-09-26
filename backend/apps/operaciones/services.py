from decimal import Decimal
from apps.clientes.models import Cliente
from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from .models import MetodoFinanciero, MetodoFinancieroDetalle, CuentaBancaria, BilleteraDigital, Tarjeta, TarjetaLocal
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


def _get_comision_especifica(detalle_metodo, operacion_casa):
    """
    Obtiene la comisión específica del catálogo si está habilitada,
    sino devuelve None para usar la comisión por defecto del MetodoFinanciero.
    
    Args:
        detalle_metodo: MetodoFinancieroDetalle instance
        operacion_casa: "compra" o "venta"
    
    Returns:
        Decimal|None: Comisión específica del catálogo o None
    """
    try:
        # Verificar si tiene cuenta bancaria específica
        if hasattr(detalle_metodo, 'cuenta_bancaria'):
            banco = detalle_metodo.cuenta_bancaria.banco
            if operacion_casa == "compra":
                # Casa compra = cliente vende = pago para casa
                if banco.comision_personalizada_compra:
                    return banco.comision_compra
            else:  # operacion_casa == "venta"
                # Casa vende = cliente compra = cobro para casa
                if banco.comision_personalizada_venta:
                    return banco.comision_venta
        
        # Verificar si tiene billetera digital específica
        elif hasattr(detalle_metodo, 'billetera_digital'):
            billetera_catalogo = detalle_metodo.billetera_digital.plataforma
            if operacion_casa == "compra":
                if billetera_catalogo.comision_personalizada_compra:
                    return billetera_catalogo.comision_compra
            else:  # operacion_casa == "venta"
                if billetera_catalogo.comision_personalizada_venta:
                    return billetera_catalogo.comision_venta
        
        # Verificar si tiene tarjeta local específica
        elif hasattr(detalle_metodo, 'tarjeta_local'):
            tarjeta_catalogo = detalle_metodo.tarjeta_local.marca
            if operacion_casa == "compra":
                if tarjeta_catalogo.comision_personalizada_compra:
                    return tarjeta_catalogo.comision_compra
            else:  # operacion_casa == "venta"
                if tarjeta_catalogo.comision_personalizada_venta:
                    return tarjeta_catalogo.comision_venta
        
        # Para tarjetas de Stripe no hay catálogo específico, usar MetodoFinanciero
        
    except AttributeError:
        # Si no tiene instancia específica asociada, usar comisión por defecto
        pass
    
    return None


def listar_metodos_cliente_por_divisas(cliente_id, divisa_origen_id, divisa_destino_id):
    """
    Dada una combinación de divisas y un cliente, devuelve los métodos financieros
    disponibles organizados por tipo con las instancias específicas del cliente.
    """
    cliente = Cliente.objects.get(idCliente=cliente_id)
    divisa_origen = Divisa.objects.get(id=divisa_origen_id)
    divisa_destino = Divisa.objects.get(id=divisa_destino_id)

    _, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)

    # Obtener métodos financieros disponibles para la operación
    if operacion_casa == "compra":
        metodos_disponibles = MetodoFinanciero.objects.filter(is_active=True, permite_pago=True)
    elif operacion_casa == "venta":
        metodos_disponibles = MetodoFinanciero.objects.filter(is_active=True, permite_cobro=True)
    else:
        raise ValueError("Operación inválida")

    # Organizar métodos por tipo con instancias del cliente
    metodos_organizados = {}
    
    for metodo in metodos_disponibles:
        # Obtener instancias específicas del cliente para este método
        instancias_cliente = MetodoFinancieroDetalle.objects.filter(
            cliente=cliente,
            metodo_financiero=metodo,
            is_active=True,
            desactivado_por_catalogo=False
        ).select_related('metodo_financiero')

        # Preparar datos de instancias específicas
        instancias_data = []
        for instancia in instancias_cliente:
            instancia_data = {
                'id': instancia.id,
                'alias': instancia.alias,
                'tipo_especifico': None,
                'detalles': {}
            }

            # Agregar detalles específicos según el tipo
            try:
                if hasattr(instancia, 'cuenta_bancaria'):
                    cuenta = instancia.cuenta_bancaria
                    instancia_data['tipo_especifico'] = 'cuenta_bancaria'
                    instancia_data['detalles'] = {
                        'banco_nombre': cuenta.banco.nombre,
                        'numero_cuenta': cuenta.numero_cuenta,
                        'titular': cuenta.titular,
                        'cbu_cvu': cuenta.cbu_cvu
                    }
                elif hasattr(instancia, 'billetera_digital'):
                    billetera = instancia.billetera_digital
                    instancia_data['tipo_especifico'] = 'billetera_digital'
                    instancia_data['detalles'] = {
                        'plataforma_nombre': billetera.plataforma.nombre,
                        'usuario_id': billetera.usuario_id,
                        'email': billetera.email,
                        'telefono': billetera.telefono
                    }
                elif hasattr(instancia, 'tarjeta'):
                    tarjeta = instancia.tarjeta
                    instancia_data['tipo_especifico'] = 'tarjeta'
                    instancia_data['detalles'] = {
                        'brand': tarjeta.brand,
                        'last4': tarjeta.last4,
                        'titular': tarjeta.titular,
                        'exp_month': tarjeta.exp_month,
                        'exp_year': tarjeta.exp_year
                    }
                elif hasattr(instancia, 'tarjeta_local'):
                    tarjeta_local = instancia.tarjeta_local
                    instancia_data['tipo_especifico'] = 'tarjeta_local'
                    instancia_data['detalles'] = {
                        'marca_nombre': tarjeta_local.marca.marca,
                        'last4': tarjeta_local.last4,
                        'titular': tarjeta_local.titular,
                        'exp_month': tarjeta_local.exp_month,
                        'exp_year': tarjeta_local.exp_year
                    }
            except:
                # Si no tiene instancia específica, usar datos básicos
                pass

            instancias_data.append(instancia_data)

        metodos_organizados[metodo.nombre] = {
            'metodo_financiero': {
                'id': metodo.id,
                'nombre': metodo.nombre,
                'nombre_display': metodo.get_nombre_display(),
                'comision_cobro_porcentaje': float(metodo.comision_cobro_porcentaje),
                'comision_pago_porcentaje': float(metodo.comision_pago_porcentaje)
            },
            'instancias': instancias_data
        }

    return operacion_casa, metodos_organizados


def calcular_simulacion_operacion_privada_con_instancia(cliente_id, divisa_origen_id, divisa_destino_id, monto, detalle_metodo_id=None, metodo_id=None):
    """
    Simulación para usuario autenticado (con cliente).
    Puede usar una instancia específica (detalle_metodo_id) o un método genérico (metodo_id).
    
    Si usa instancia específica, aplicará comisión del catálogo específico si está habilitada,
    sino usará la comisión por defecto del MetodoFinanciero.
    """
    monto = Decimal(monto)
    cliente = Cliente.objects.get(idCliente=cliente_id)

    divisa_origen = _get_divisa(divisa_origen_id)
    divisa_destino = _get_divisa(divisa_destino_id)

    # Determinar el método financiero a usar y la comisión específica
    if detalle_metodo_id:
        detalle = MetodoFinancieroDetalle.objects.select_related(
            'metodo_financiero'
        ).prefetch_related(
            'cuenta_bancaria__banco',
            'billetera_digital__plataforma',
            'tarjeta_local__marca'
        ).get(id=detalle_metodo_id, cliente=cliente)
        
        metodo = detalle.metodo_financiero
        metodo_nombre = f"{detalle.alias} ({metodo.get_nombre_display()})"
    else:
        metodo = _get_metodo(metodo_id)
        metodo_nombre = metodo.get_nombre_display()
        detalle = None

    operacion_cliente, operacion_casa = _inferir_operacion(divisa_origen, divisa_destino)
    divisa_extranjera = divisa_origen if not divisa_origen.es_base else divisa_destino
    tasa = _get_tasa_activa(divisa_extranjera)

    # Determinar la comisión a usar
    if operacion_casa == "compra":
        # Casa COMPRA → Cliente vende
        # Buscar comisión específica del catálogo si existe instancia
        comision_especifica = None
        if detalle:
            comision_especifica = _get_comision_especifica(detalle, operacion_casa)
        
        # Usar comisión específica o por defecto
        com_metodo = comision_especifica if comision_especifica is not None else metodo.comision_pago_porcentaje
        
        tc = TasaService.calcular_tasa_compra_metodoPago_cliente(tasa, metodo, cliente)
        monto_destino = monto * tc
    else:
        # Casa VENDE → Cliente compra
        # Buscar comisión específica del catálogo si existe instancia
        comision_especifica = None
        if detalle:
            comision_especifica = _get_comision_especifica(detalle, operacion_casa)
        
        # Usar comisión específica o por defecto
        com_metodo = comision_especifica if comision_especifica is not None else metodo.comision_cobro_porcentaje
        
        tc = TasaService.calcular_tasa_venta_metodoPago_cliente(tasa, metodo, cliente)
        monto_destino = monto / tc

    return {
        "operacion_cliente": operacion_cliente,
        "operacion_casa": operacion_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "nombre_categoria": cliente.idCategoria.nombre,
            "descuento_categoria": float(cliente.idCategoria.descuento),
            "nombre_metodo": metodo_nombre,
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2)
    }


def calcular_simulacion_operacion_privada(cliente_id, divisa_origen_id, divisa_destino_id, monto, metodo_id):
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
        com_metodo = metodo.comision_pago_porcentaje
    else:
        # Casa VENDE → Cliente compra
        tc = TasaService.calcular_tasa_venta_metodoPago_cliente(tasa, metodo, cliente)
        monto_destino = monto / tc
        com_metodo = metodo.comision_cobro_porcentaje

    return {
        "operacion_cliente": operacion_cliente,
        "operacion_casa": operacion_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "nombre_categoria": cliente.idCategoria.nombre,
            "descuento_categoria": float(cliente.idCategoria.descuento),
            "nombre_metodo": metodo.get_nombre_display(),
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2)
    }


def calcular_simulacion_operacion_publica(divisa_origen_id, divisa_destino_id, monto, metodo_id):
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
        com_metodo = metodo.comision_pago_porcentaje
    else:
        # Casa VENDE → Cliente compra
        tc = TasaService.calcular_tasa_venta_metodoPago(tasa, metodo)
        monto_destino = monto / tc
        com_metodo = metodo.comision_cobro_porcentaje

    return {
        "operacion_cliente": operacion_cliente,
        "operacion_casa": operacion_casa,
        "divisa_origen": divisa_origen.codigo,
        "divisa_destino": divisa_destino.codigo,
        "parametros": {
            "nombre_metodo": metodo.get_nombre_display(),
            "comision_metodo": float(com_metodo),
        },
        "tc_final": round(tc, 4),
        "monto_origen": float(monto),
        "monto_destino": round(monto_destino, 2)
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
