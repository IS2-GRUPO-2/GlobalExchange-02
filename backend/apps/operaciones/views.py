"""
Módulo de vistas para la gestión de métodos financieros y sus detalles.

Proporciona ViewSets para CRUD sobre el catálogo central de métodos
financieros (`MetodoFinanciero`) y sus implementaciones específicas
(`MetodoFinancieroDetalle`, `CuentaBancaria`, `BilleteraDigital`, `Tarjeta`).

"""
# imports (arriba, junto a los demás)
# NUEVO: simulador de pagos
from .pyments import APROBADO, componenteSimuladorPagosCobros   
from decimal import Decimal, ROUND_HALF_UP  # ya lo tenías, asegúrate de tener Decimal importado aquí
from decimal import ROUND_HALF_UP, Decimal
from apps.cotizaciones.service import TasaService
from rest_framework import viewsets, status, filters, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.utils import timezone
from .models import (
    Transaccion
)
from .serializers import (
    TransaccionDetalleSerializer,
    TransaccionSerializer,
    OperacionSerializer
)

from .service import (
    calcular_operacion,  
    inferir_op_perspectiva_casa,
    _get_tasa_activa,
)


#=============================================================
# Vistas de operaciones
#=============================================================

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
            resultado = calcular_operacion(
                cliente_id=data.get("cliente_id", None),
                divisa_origen_id=data.get("divisa_origen"),
                divisa_destino_id=data.get("divisa_destino"),
                op_perspectiva_casa=data.get("op_perspectiva_casa"),
                monto=data.get("monto_origen"),
                metodo_id=data.get("metodo_id", None),
                detalle_metodo_id=data.get("detalle_metodo_id", None)
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
                monto=data.get("monto_origen"),
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

        op_perspectiva_casa = inferir_op_perspectiva_casa(divisa_origen_id, divisa_destino_id)

        return Response(
            {
                "op_perspectiva_casa": op_perspectiva_casa,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.select_related(
        'id_user', 'cliente', 'divisa_origen', 'divisa_destino', 
        'metodo_financiero', 'tauser'
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cliente__nombre', 'operador__username']
    filterset_fields = ['operacion', 'estado', 'divisa_origen', 'divisa_destino', 'id_user', 'cliente']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'monto_origen', 'monto_destino', 'created_at']
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
        
        transaccion.estado = 'completada'
        transaccion.fecha_fin = timezone.now()
        transaccion.save()
        
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

        

    @action(detail=True, methods=['get'], url_path='reconfirmar-tasa')
    def reconfirmar_tasa(self, request, pk=None):
        transaccion = self.get_object()

        tc_actual, monto_destino_actual = self._recalcular_tc_y_monto(transaccion)

        # Diferencias
        delta_tc = (tc_actual - Decimal(transaccion.tasa_aplicada))
        # Evitar div/0
        delta_pct = (delta_tc / Decimal(transaccion.tasa_aplicada) * Decimal('100')) if Decimal(transaccion.tasa_aplicada) != 0 else Decimal('0')

        payload = {
            'cambio': bool(delta_tc != 0),
            'tasa_anterior': str(transaccion.tasa_aplicada),
            'tasa_actual': str(tc_actual),
            'delta_tc': str(delta_tc),              # absoluto
            'delta_pct': str(delta_pct),           # %
            'monto_destino_anterior': str(transaccion.monto_destino),
            'monto_destino_actual': str(monto_destino_actual),
        }
        return Response(payload, status=status.HTTP_200_OK)

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

        terminos_aceptados = bool(request.data.get('terminos_aceptados', False))
        if not terminos_aceptados:
            return Response({'error': 'Debe aceptar los términos y condiciones.'},
                            status=status.HTTP_400_BAD_REQUEST)

        acepta_cambio = bool(request.data.get('acepta_cambio', False))

        tc_actual, monto_destino_actual = self._recalcular_tc_y_monto(transaccion)
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
        transaccion.estado = 'en_proceso'
        transaccion.save()

        serializer = self.get_serializer(transaccion)
        data = dict(serializer.data)
        data['pago_codigo'] = pago.codigo
        data['pago_mensaje'] = pago.mensaje
        data['pago_referencia'] = pago.referencia
        return Response(data, status=status.HTTP_200_OK)
