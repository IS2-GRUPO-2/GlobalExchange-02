"""
Módulo de vistas para la gestión de métodos financieros y sus detalles.

Proporciona ViewSets para CRUD sobre el catálogo central de métodos
financieros (`MetodoFinanciero`) y sus implementaciones específicas
(`MetodoFinancieroDetalle`, `CuentaBancaria`, `BilleteraDigital`, `Tarjeta`).

"""
# imports (arriba, junto a los demás)
# NUEVO: simulador de pagos
from .pyments import APROBADO, componenteSimuladorPagosCobros, completar_pago_stripe, guardar_tarjeta_stripe
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from django.db import transaction as db_transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.cotizaciones.service import TasaService
from apps.metodos_financieros.models import MetodoFinanciero, TipoMetodoFinanciero
from apps.pagos.models import Pagos
from apps.stock.models import TipoMovimiento, MovimientoStock, EstadoMovimiento
from apps.stock.serializers import MovimientoStockSerializer
from apps.tauser.models import Tauser
from globalexchange.configuration import config
from apps.clientes.models import Cliente
from apps.divisas.models import LimiteConfig

from .models import Transaccion
from .serializers import (
    TransaccionDetalleSerializer,
    TransaccionSerializer,
    OperacionSerializer
)

from .service import (
    calcular_operacion,
    calcular_operacion,
    inferir_op_perspectiva_casa,
    _get_tasa_activa,
)

import stripe

stripe.api_key = config.STRIPE_KEY
endpoint_secret = config.STRIPE_WEBHOOK_SECRET

# =============================================================
# Vistas de operaciones
# =============================================================


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def operacion_privada(request):
    """
    Endpoint privado para operaciones
    """
    serializer = OperacionSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data

            cliente_id = data.get("cliente_id")
            if not cliente_id:
                return Response(
                    {"error": "Debe indicar el cliente para validar los límites de operación."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cliente = Cliente.objects.get(id=cliente_id)

            resultado = calcular_operacion(
                cliente_id=data.get("cliente_id", None),
                divisa_origen_id=data.get("divisa_origen"),
                divisa_destino_id=data.get("divisa_destino"),
                op_perspectiva_casa=data.get("op_perspectiva_casa"),
                monto=data.get("monto"),
                metodo_id=data.get("metodo_id", None),
                detalle_metodo_id=data.get("detalle_metodo_id", None)
            )

            # Validar limites diarios/mensuales en divisa base
            limite_cfg = LimiteConfig.get_solo()
            limite_mensual = limite_cfg.limite_mensual
            limite_diario = limite_cfg.limite_diario

            # Determinar el monto en divisa base segun la perspectiva
            if data.get("op_perspectiva_casa") == "compra":
                monto_base = Decimal(str(resultado["monto_destino"]))
            else:
                monto_base = Decimal(str(resultado["monto_origen"]))

            # Validar limite mensual primero
            if limite_mensual is not None:
                total_mensual = (cliente.gasto_mensual or Decimal("0")) + monto_base
                if total_mensual > limite_mensual:
                    return Response(
                        {"error": "Límite mensual alcanzado para este cliente."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Luego validar limite diario
            if limite_diario is not None:
                total_diario = (cliente.gasto_diario or Decimal("0")) + monto_base
                if total_diario > limite_diario:
                    return Response(
                        {"error": "Límite diario alcanzado para este cliente."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def operacion_publica(request):
    """
    Endpoint público para operaciones (landing page).
    """

    print(request.data)  # Debug: Verifica los datos recibidos
    serializer = OperacionSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            print(data)
            resultado = calcular_operacion(
                divisa_origen_id=data.get("divisa_origen"),
                divisa_destino_id=data.get("divisa_destino"),
                monto=data.get("monto"),
                op_perspectiva_casa=data.get("op_perspectiva_casa"),
                metodo_id=data.get("metodo_id"),
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def get_op_perspectiva_casa(request) -> str:
    """
    Determina el tipo de operación desde la perspectiva del cliente y la casa.
    """
    try:
        divisa_origen_id = request.query_params.get("divisa_origen")
        divisa_destino_id = request.query_params.get("divisa_destino")

        if not divisa_origen_id or not divisa_destino_id:
            return Response({"error": "Debe indicar divisa_origen y divisa_destino"}, status=400)

        if divisa_origen_id == divisa_destino_id:
            return Response(
                {"error": "La divisa de origen y destino no pueden ser iguales."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        op_perspectiva_casa = inferir_op_perspectiva_casa(
            divisa_origen_id, divisa_destino_id)

        return Response(
            {
                "op_perspectiva_casa": op_perspectiva_casa,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["POST"])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META["HTTP_STRIPE_SIGNATURE"]
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.SignatureVerificationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if (
        event['type'] == 'checkout.session.completed'
        or event['type'] == 'checkout.session.async_payment_succeded'
    ):
        completar_pago_stripe(event['data']['object']['id'])

    # TODO: Manejar de manera correcta el almacenamiento de tarjetas con Stripe
    #if event['type'] == 'payment_method.attached':
    #    guardar_tarjeta_stripe(event['data']['object']['id'])

    return Response(data=None, status=status.HTTP_200_OK)


class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.select_related(
        'id_user', 'cliente', 'divisa_origen', 'divisa_destino',
        'metodo_financiero', 'tauser'
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cliente__nombre', 'operador__username']
    filterset_fields = ['operacion', 'estado',
                        'divisa_origen', 'divisa_destino', 'id_user', 'cliente']
    ordering_fields = ['fecha_inicio', 'fecha_fin',
                       'monto_origen', 'monto_destino', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TransaccionSerializer
        return TransaccionDetalleSerializer

    def create(self, request, *args, **kwargs):
        """
        Método create personalizado para manejar correctamente los métodos financieros.

        Lógica:
        - Si se envía metodo_financiero (EFECTIVO/CHEQUE): Se usa directamente
        - Si se envía metodo_financiero_detalle: Se obtiene metodo_financiero desde el detalle
        - Siempre se garantiza que metodo_financiero esté poblado
        """
        from apps.metodos_financieros.models import MetodoFinancieroDetalle

        # Obtener los datos del request (antes de la serialización)
        data = request.data.copy()

        # Manejar la lógica de métodos financieros
        metodo_financiero_id = data.get('metodo_financiero')
        metodo_financiero_detalle_id = data.get('metodo_financiero_detalle')

        if metodo_financiero_detalle_id and not metodo_financiero_id:
            # Caso: Se envió detalle_metodo_id (cuenta bancaria, billetera, tarjeta, etc.)
            # Obtener el método financiero desde el detalle
            try:
                detalle = MetodoFinancieroDetalle.objects.select_related('metodo_financiero').get(
                    id=metodo_financiero_detalle_id
                )
                # Agregar el metodo_financiero automáticamente
                data['metodo_financiero'] = detalle.metodo_financiero.id
            except MetodoFinancieroDetalle.DoesNotExist:
                return Response(
                    {'error': f'MetodoFinancieroDetalle con ID {metodo_financiero_detalle_id} no existe'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif metodo_financiero_id and not metodo_financiero_detalle_id:
            # Caso: Se envió metodo_id (EFECTIVO/CHEQUE)
            # Ya está configurado correctamente, no necesita cambios
            pass
        elif not metodo_financiero_id and not metodo_financiero_detalle_id:
            return Response(
                {'error': 'Debe proporcionar metodo_financiero o metodo_financiero_detalle'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif metodo_financiero_id and metodo_financiero_detalle_id:
            return Response(
                {'error': 'No puede proporcionar ambos metodo_financiero y metodo_financiero_detalle'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ahora proceder con la validación y creación usando los datos modificados
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Crear la transacción con los datos validados y procesados
        transaccion = serializer.save()

        # Serializar la respuesta
        response_serializer = self.get_serializer(transaccion)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite eliminar transacciones'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(detail=True, methods=['patch'])
    def completar(self, request, pk=None):
        """Marcar transacción como completada"""
        transaccion = self.get_object()
        if transaccion.estado != 'pendiente' and transaccion.estado != 'en_proceso':
            return Response(
                {'error': 'Solo se pueden completar transacciones pendientes o en proceso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_finalizado = (
            EstadoMovimiento.objects.filter(codigo="FINALIZADO").first()
        )

        with db_transaction.atomic():
            transaccion.estado = 'completada'
            transaccion.fecha_fin = timezone.now()
            transaccion.save(update_fields=['estado', 'fecha_fin', 'updated_at'])

            if estado_finalizado:
                MovimientoStock.objects.filter(transaccion=transaccion).update(
                    estado=estado_finalizado
                )

        serializer = self.get_serializer(transaccion)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cancelar(self, request, pk=None):
        """Cancelar transacción"""
        transaccion = self.get_object()
        if transaccion.estado == 'completada':
            return Response(
                {'error': 'No se puede cancelar una transacción completada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaccion.estado = 'cancelada'
        transaccion.fecha_fin = timezone.now()
        transaccion.save()

        serializer = self.get_serializer(transaccion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de transacciones"""
        queryset = self.get_queryset()

        total = queryset.count()
        pendientes = queryset.filter(estado='pendiente').count()
        completadas = queryset.filter(estado='completada').count()
        canceladas = queryset.filter(estado='cancelada').count()

        # Montos por divisa
        from django.db.models import Sum
        montos_por_divisa = {}
        for transaccion in queryset.filter(estado='completada'):
            divisa = transaccion.divisa_origen.codigo
            if divisa not in montos_por_divisa:
                montos_por_divisa[divisa] = 0.0
            montos_por_divisa[divisa] += float(transaccion.monto_origen)

        return Response({
            'total': total,
            'pendientes': pendientes,
            'completadas': completadas,
            'canceladas': canceladas,
            'montos_por_divisa': montos_por_divisa
        })
        # ...código existente de TransaccionViewSet...

    @action(detail=False, methods=['get'])
    def cantidad_transacciones_clientes(self, request):
        """
        Obtiene el conteo de transacciones por estado para un cliente específico.
        Requiere el parámetro 'cliente' en la URL.
        Opcionalmente acepta 'estado' para filtrar por un estado específico.

        Ejemplo de uso:
        - /api/transacciones/cantidad_transacciones_clientes/?cliente=123
        - /api/transacciones/cantidad_transacciones_clientes/?cliente=123&estado=pendiente
        """
        cliente_id = request.query_params.get('cliente')
        if not cliente_id:
            return Response(
                {'error': 'Debe proporcionar el ID del cliente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtrar transacciones por cliente
        queryset = self.get_queryset().filter(cliente_id=cliente_id)

        # Si se especifica un estado, filtrar también por estado
        estado = request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
            return Response({
                'cliente_id': cliente_id,
                'estado': estado,
                'total': queryset.count()
            })
        else:
            # Si no se especifica estado, devolver conteo por cada estado
            return Response({
                'cliente_id': cliente_id,
                'total': queryset.count(),
                'pendientes': queryset.filter(estado='pendiente').count(),
                'en_proceso': queryset.filter(estado='en_proceso').count(),
                'completadas': queryset.filter(estado='completada').count(),
                'canceladas': queryset.filter(estado='cancelada').count(),
                'fallidas': queryset.filter(estado='fallida').count(),
            })
    def _get_tauser(self, tauser_id):
        try:
            return Tauser.objects.get(pk=tauser_id)
        except Tauser.DoesNotExist:
            raise ValidationError('El tauser indicado no existe.')

    def _get_tipo_movimiento(self, codigo: str) -> TipoMovimiento:
        try:
            return TipoMovimiento.objects.get(codigo=codigo)
        except TipoMovimiento.DoesNotExist:
            raise ValidationError(f"El tipo de movimiento '{codigo}' no está configurado.")

    def _get_metodo_financiero(self, nombre: str) -> MetodoFinanciero:
        try:
            return MetodoFinanciero.objects.get(nombre=nombre)
        except MetodoFinanciero.DoesNotExist:
            raise ValidationError(f"El método financiero '{nombre}' no está disponible.")

    def _get_divisa_extranjera_id(self, transaccion: Transaccion) -> int:
        if not transaccion.divisa_origen.es_base:
            return transaccion.divisa_origen_id
        return transaccion.divisa_destino_id

    def _registrar_movimiento_entclt(self, transaccion: Transaccion, tauser: Tauser, detalles):
        tipo_mov = self._get_tipo_movimiento('ENTCLT')
        data = {
            'tipo_movimiento': tipo_mov.pk,
            'tauser': str(tauser.id),
            'transaccion': transaccion.id,
            'divisa': self._get_divisa_extranjera_id(transaccion),
            'detalles': detalles,
        }
        serializer = MovimientoStockSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        detalles_validados = serializer.validated_data.get('detalles', [])
        if not detalles_validados:
            raise ValidationError('Debe proporcionar al menos una denominación válida.')

        total = Decimal('0')
        for item in detalles_validados:
            denominacion = Decimal(str(item['denominacion'].denominacion))
            cantidad = Decimal(item['cantidad'])
            total += denominacion * cantidad

        total = total.quantize(Decimal('0.01'))
        esperado = Decimal(str(transaccion.monto_origen)).quantize(Decimal('0.01'))
        if total != esperado:
            raise ValidationError(
                f"Las denominaciones suman {total} pero se esperaba {esperado}."
            )

        serializer.save()

    def _registrar_movimiento_salclt(self, transaccion: Transaccion, tauser: Tauser):
        tipo_mov = self._get_tipo_movimiento('SALCLT')
        data = {
            'tipo_movimiento': tipo_mov.pk,
            'tauser': str(tauser.id),
            'transaccion': transaccion.id,
            'divisa': self._get_divisa_extranjera_id(transaccion),
        }
        serializer = MovimientoStockSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    def _registrar_pagos_compra(self, transaccion: Transaccion):
        metodo = transaccion.metodo_financiero
        if not metodo:
            return

        mensajes = {
            TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA: 'Transferencia bancaria aprobada en tauser',
            TipoMetodoFinanciero.BILLETERA_DIGITAL: 'Transferencia a billetera digital aprobada en tauser',
        }

        mensaje = mensajes.get(metodo.nombre)
        if not mensaje:
            return

        detalle_alias = getattr(getattr(transaccion, "metodo_financiero_detalle", None), "alias", None)
        if detalle_alias:
            mensaje = f"{mensaje} - {detalle_alias}"

        Pagos.objects.update_or_create(
            transaccion=transaccion,
            metodo_pago=metodo,
            defaults={
                'request': f'SIM_{metodo.nombre}_TAUSER',
                'response': mensaje,
                'estado': 'APROBADO',
            }
        )

    def _registrar_pago_operacion(self, transaccion: Transaccion):
        if transaccion.operacion != "venta":
            return

        if not transaccion.metodo_financiero:
            return

        if transaccion.metodo_financiero.nombre not in {
            TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
            TipoMetodoFinanciero.BILLETERA_DIGITAL,
            TipoMetodoFinanciero.TARJETA,
        }:
            return

        Pagos.objects.update_or_create(
            transaccion=transaccion,
            metodo_pago=transaccion.metodo_financiero,
            defaults={
                "request": transaccion.metodo_financiero.nombre,
                "response": f"Pago con {transaccion.metodo_financiero.nombre} registrado",
                "estado": "APROBADO",
            },
        )

    def _recalcular_tc_y_monto(self, transaccion: Transaccion):
        """
        Recalcula la tasa vigente y el monto_destino actual usando la misma lógica que la operacion:
        - Cliente 'venta'  => Casa COMPRA => monto_destino = monto * tc
        - Cliente 'compra' => Casa VENDE  => monto_destino = monto / tc
        """

        resultado = calcular_operacion(
            cliente_id=transaccion.cliente.id,
            divisa_origen_id=transaccion.divisa_origen.id,
            divisa_destino_id=transaccion.divisa_destino.id,
            monto=transaccion.monto_origen,
            metodo_id=transaccion.metodo_financiero.id if transaccion.metodo_financiero else None,
            detalle_metodo_id=transaccion.metodo_financiero_detalle.id if transaccion.metodo_financiero_detalle else None,
            op_perspectiva_casa=transaccion.operacion
        )

        tc_final = resultado['tc_final']
        monto_destino = resultado['monto_destino']

        return tc_final, monto_destino

    def _build_reconfirm_payload(self, transaccion: Transaccion):
        tc_actual, monto_destino_actual = self._recalcular_tc_y_monto(
            transaccion)

        delta_tc = (tc_actual - Decimal(transaccion.tasa_aplicada))
        delta_pct = (delta_tc / Decimal(transaccion.tasa_aplicada) * Decimal('100')
                     ) if Decimal(transaccion.tasa_aplicada) != 0 else Decimal('0')

        payload = {
            'cambio': bool(delta_tc != 0),
            'tasa_anterior': str(transaccion.tasa_aplicada),
            'tasa_actual': str(tc_actual),
            'delta_tc': str(delta_tc),
            'delta_pct': str(delta_pct),
            'monto_destino_anterior': str(transaccion.monto_destino),
            'monto_destino_actual': str(monto_destino_actual),
        }
        return payload, tc_actual, monto_destino_actual

    @action(detail=True, methods=['get'], url_path='reconfirmar-tasa')
    def reconfirmar_tasa(self, request, pk=None):
        transaccion = self.get_object()

        payload, _, _ = self._build_reconfirm_payload(transaccion)
        return Response(payload, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['get'],
        url_path='reconfirmar-tasa-simulador-pago',
        permission_classes=[permissions.AllowAny],
    )
    def reconfirmar_tasa_simulador_pago(self, request, pk=None):
        transaccion = self.get_object()
        payload, tc_actual, monto_destino_actual = self._build_reconfirm_payload(
            transaccion)

        payload['transaccion'] = {
            'monto_origen': str(transaccion.monto_origen),
            'monto_destino': str(transaccion.monto_destino),
            'divisa_origen': getattr(transaccion.divisa_origen, 'codigo', None),
            'divisa_destino': getattr(transaccion.divisa_destino, 'codigo', None),
            'cliente_nombre': getattr(transaccion.cliente, 'nombre', None),
            'operacion': transaccion.operacion,
            'tasa_inicial': str(transaccion.tasa_inicial),
        }
        payload['tasa_actual'] = str(tc_actual)
        payload['monto_destino_actual'] = str(monto_destino_actual)
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='actualizar-reconfirmacion')
    def actualizar_reconfirmacion(self, request, pk=None):
        transaccion = self.get_object()

        tasa_actual = request.data.get('tasa_actual')
        monto_destino_actual = request.data.get('monto_destino_actual')
        monto_origen = request.data.get('monto_origen')

        campos_actualizados = []

        try:
            if tasa_actual is not None:
                transaccion.tasa_aplicada = Decimal(str(tasa_actual))
                campos_actualizados.append('tasa_aplicada')
            if monto_destino_actual is not None:
                transaccion.monto_destino = Decimal(str(monto_destino_actual))
                campos_actualizados.append('monto_destino')
            if monto_origen is not None:
                transaccion.monto_origen = Decimal(str(monto_origen))
                campos_actualizados.append('monto_origen')
        except (InvalidOperation, TypeError):
            return Response({'error': 'Valores numericos invalidos.'}, status=status.HTTP_400_BAD_REQUEST)

        if not campos_actualizados:
            return Response({'error': 'No se proporcionaron valores para actualizar.'}, status=status.HTTP_400_BAD_REQUEST)

        campos_actualizados.append('updated_at')
        transaccion.save(update_fields=campos_actualizados)
        serializer = self.get_serializer(transaccion)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='confirmar-pago')
    def confirmar_pago(self, request, pk=None):
        """
        Body esperado:
        {
        "terminos_aceptados": true,
        "acepta_cambio": false|true
        }
        """
        transaccion = self.get_object()  # <-- IMPORTANTE: definir t en el scope

        if transaccion.estado not in ('pendiente', 'en_proceso'):
            return Response({'error': 'La transacción no está en un estado confirmable.'},
                            status=status.HTTP_400_BAD_REQUEST)

        terminos_aceptados = bool(
            request.data.get('terminos_aceptados', False))
        if not terminos_aceptados:
            return Response({'error': 'Debe aceptar los términos y condiciones.'},
                            status=status.HTTP_400_BAD_REQUEST)

        acepta_cambio = bool(request.data.get('acepta_cambio', False))

        tc_actual, monto_destino_actual = self._recalcular_tc_y_monto(
            transaccion)
        cambio = (tc_actual != Decimal(transaccion.tasa_aplicada))

        # Si la tasa cambió y NO acepta el cambio → devolvemos conflicto (409)
        if cambio and not acepta_cambio:
            return Response({
                'error': 'rate_changed',
                'mensaje': 'La cotización cambió',
                'tasa_anterior': str(transaccion.tasa_aplicada),
                'tasa_actual': str(tc_actual),
                'monto_destino_actual': str(monto_destino_actual)
            }, status=status.HTTP_409_CONFLICT)

        # Si no cambió, o cambió y el cliente acepta, aplicamos posible nueva tasa
        if cambio and acepta_cambio:
            transaccion.tasa_aplicada = tc_actual
            transaccion.monto_destino = monto_destino_actual

        # 2) Simular pago/cobro en el procesador (dummy)
        pago = componenteSimuladorPagosCobros(transaccion)

        if pago.codigo != APROBADO:
            # Simular rechazo → marcamos como fallida
            transaccion.estado = 'fallida'
            transaccion.fecha_fin = timezone.now()
            transaccion.save()

            serializer = self.get_serializer(transaccion)
            data = dict(serializer.data)
            data['pago_codigo'] = pago.codigo
            data['pago_mensaje'] = pago.mensaje
            data['pago_referencia'] = pago.referencia
            # 402 = Payment Required
            return Response(data, status=status.HTTP_402_PAYMENT_REQUIRED)

        # Aprobado → pasar a EN PROCESO
        cliente = transaccion.cliente
        transaccion.estado = 'en_proceso'
        monto = transaccion.monto_origen if transaccion.operacion == "venta" else transaccion.monto_destino
        cliente.gasto_diario += monto
        cliente.gasto_mensual += monto
        cliente.save()
        transaccion.save()
        self._registrar_pago_operacion(transaccion)

        serializer = self.get_serializer(transaccion)
        data = dict(serializer.data)
        data['pago_codigo'] = pago.codigo
        data['pago_mensaje'] = pago.mensaje
        data['pago_referencia'] = pago.referencia
        return Response(data, status=status.HTTP_200_OK)

    @action(methods=['POST'], detail=True)
    def crear_checkout_stripe(self, request, pk=None):
        transaccion = self.get_object()  # <-- IMPORTANTE: definir t en el scope
        cliente = transaccion.cliente

        if transaccion.estado not in ('pendiente', 'en_proceso'):
            return Response({'error': 'La transacción no está en un estado confirmable.'},
                            status=status.HTTP_400_BAD_REQUEST)

        terminos_aceptados = bool(
            request.data.get('terminos_aceptados', False))
        if not terminos_aceptados:
            return Response({'error': 'Debe aceptar los términos y condiciones.'},
                            status=status.HTTP_400_BAD_REQUEST)

        acepta_cambio = bool(request.data.get('acepta_cambio', False))

        tc_actual, monto_destino_actual = self._recalcular_tc_y_monto(
            transaccion)
        cambio = (tc_actual != Decimal(transaccion.tasa_aplicada))

        # Si la tasa cambió y NO acepta el cambio → devolvemos conflicto (409)
        if cambio and not acepta_cambio:
            return Response({
                'error': 'rate_changed',
                'mensaje': 'La cotización cambió',
                'tasa_anterior': str(transaccion.tasa_aplicada),
                'tasa_actual': str(tc_actual),
                'monto_destino_actual': str(monto_destino_actual)
            }, status=status.HTTP_409_CONFLICT)

        # Si no cambió, o cambió y el cliente acepta, aplicamos posible nueva tasa
        if cambio and acepta_cambio:
            transaccion.tasa_aplicada = tc_actual
            transaccion.monto_destino = monto_destino_actual

        transaccion.save()
        DOMAIN = config.DEV_URL if config.DJANGO_DEBUG else config.PROD_URL

        try:
            if not cliente.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=cliente.correo,
                    name=cliente.nombre
                )
                cliente.stripe_customer_id = customer.id
                cliente.save()

            pago = Pagos.objects.create(
                transaccion=transaccion,
                metodo_pago=transaccion.metodo_financiero,
                request="CREAR_SESION_PAGO_STRIPE",
            )

            pago.save()

            checkout_session = stripe.checkout.Session.create(
                customer=cliente.stripe_customer_id,
                line_items=[
                    {
                        "price_data": {
                            "currency": "pyg",
                            "product_data": {
                                "name": transaccion.divisa_destino.nombre
                            },
                            "unit_amount_decimal": transaccion.monto_origen
                        },
                        "quantity": 1
                    }
                ],
                mode="payment",
                success_url=DOMAIN +
                "/checkout/success?session_id={CHECKOUT_SESSION_ID}&transaccion_id="+str(
                    transaccion.id),
                cancel_url=DOMAIN +
                "/checkout/cancel?session_id={CHECKOUT_SESSION_ID}",
                locale="es",
                metadata={
                    "transaccion_id": str(transaccion.id),
                    "pago_id": str(pago.id)
                },
                saved_payment_method_options={
                    "payment_method_save": "enabled"
                }
            )

            pago.stripe_checkout_session_id = checkout_session.id

            pago.save()

        except Exception as e:
            pago.response = str(e)
            pago.save()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        pago.response = "STRIPE_CHECKOUT_SESSION_CREATED"
        pago.save()
        return Response({"url": checkout_session.url}, status=status.HTTP_200_OK)
        

    @action(detail=True, methods=['post'], url_path='recibir-efectivo')
    def recibir_efectivo(self, request, pk=None):
        """Registra la recepci?n de efectivo cuando la casa compra divisa extranjera."""
        transaccion = self.get_object()

        if transaccion.operacion != 'compra':
            return Response(
                {'error': 'Esta acci?n solo est? disponible para operaciones de compra.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transaccion.estado not in ('pendiente', 'en_proceso'):
            return Response(
                {'error': 'La transacci?n debe estar pendiente o en proceso para recibir efectivo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tauser_id = request.data.get('tauser')
        detalles = request.data.get('detalles')
        acepta_cambio = bool(request.data.get('acepta_cambio', False))

        if not tauser_id:
            raise ValidationError('Debe indicar el tauser asignado.')

        if not isinstance(detalles, list) or not detalles:
            raise ValidationError('Debe proporcionar las denominaciones recibidas.')

        tauser = self._get_tauser(tauser_id)
        fields_to_update = []

        if transaccion.tauser_id != tauser.id:
            transaccion.tauser = tauser
            fields_to_update.append('tauser')

        if transaccion.estado == 'pendiente':
            payload, _, _ = self._build_reconfirm_payload(transaccion)
            if payload['cambio']:
                if not acepta_cambio:
                    return Response(payload, status=status.HTTP_409_CONFLICT)
                transaccion.tasa_aplicada = Decimal(payload['tasa_actual'])
                transaccion.monto_destino = Decimal(payload['monto_destino_actual'])
                fields_to_update.extend(['tasa_aplicada', 'monto_destino'])

        with db_transaction.atomic():
            self._registrar_movimiento_entclt(transaccion, tauser, detalles)
            self._registrar_pagos_compra(transaccion)

            if transaccion.estado == 'pendiente':
                transaccion.estado = 'en_proceso'
                fields_to_update.append('estado')

            if fields_to_update:
                fields_to_update.append('updated_at')
                transaccion.save(update_fields=fields_to_update)

        serializer = self.get_serializer(transaccion)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='entregar-metalico')
    def entregar_metalico(self, request, pk=None):
        """Registra la entrega de met?lico cuando la casa vende divisa extranjera."""
        transaccion = self.get_object()

        if transaccion.operacion != 'venta':
            return Response(
                {'error': 'Esta acci?n solo est? disponible para operaciones de venta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transaccion.estado != 'en_proceso':
            return Response(
                {'error': 'La transacci?n debe estar en proceso para entregar met?lico.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tauser_id = request.data.get('tauser')
        if not tauser_id:
            raise ValidationError('Debe indicar el tauser asignado.')

        tauser = self._get_tauser(tauser_id)
        fields_to_update = []
        if transaccion.tauser_id != tauser.id:
            transaccion.tauser = tauser
            fields_to_update.append('tauser')

        with db_transaction.atomic():
            self._registrar_movimiento_salclt(transaccion, tauser)
            if fields_to_update:
                fields_to_update.append('updated_at')
                transaccion.save(update_fields=fields_to_update)

        serializer = self.get_serializer(transaccion)
        return Response(serializer.data, status=status.HTTP_200_OK)

