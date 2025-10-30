from collections import OrderedDict
from decimal import Decimal
from datetime import datetime, time

from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from . import serializers
from . import models
from apps.tauser.models import Tauser
from apps.tauser.serializers import TauserSerializer

class MovimientoStockViewset(viewsets.ModelViewSet):
    """
    ViewSet para registrar y listar movimientos de stock de tausers.
    """
    queryset = models.MovimientoStock.objects.all().select_related(
        'tipo_movimiento', 'tauser', 'transaccion', 'estado', 'divisa'
    ).order_by('-fecha', '-id')
    serializer_class = serializers.MovimientoStockSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        tauser = params.get('tauser')
        if tauser:
            qs = qs.filter(tauser_id=tauser)

        tipo_param = params.get('tipo_movimiento')
        if tipo_param:
            codes = [codigo.strip().upper()
                     for codigo in tipo_param.split(',') if codigo.strip()]
            if codes:
                qs = qs.filter(tipo_movimiento__codigo__in=codes)

        divisa = params.get('divisa')
        if divisa:
            qs = qs.filter(divisa_id=divisa)

        estado = params.get('estado')
        if estado:
            qs = qs.filter(estado__codigo=estado.upper())

        fecha_desde = self._parse_datetime_param(
            params.get('fecha_desde'), end=False)
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)

        fecha_hasta = self._parse_datetime_param(
            params.get('fecha_hasta'), end=True)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo movimiento de stock y genera automáticamente los detalles
        (MovimientoStockDetalle) según las denominaciones disponibles.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movimiento = serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Movimiento de stock registrado exitosamente.",
                "data": serializers.MovimientoStockSerializer(movimiento).data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """
        Retorna el stock disponible tanto en la casa como en un Tauser específico.
        """
        tauser_id = request.query_params.get('tauser')
        if not tauser_id:
            return Response(
                {"detail": "El parámetro 'tauser' es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tauser_record = Tauser.objects.filter(id=tauser_id).first()
        if not tauser_record:
            return Response(
                {"detail": "El Tauser especificado no existe."},
                status=status.HTTP_404_NOT_FOUND
            )

        tauser_stock = models.StockDivisaTauser.objects.filter(
            tauser_id=tauser_id).select_related('denominacion__divisa', 'tauser')
        casa_stock = models.StockDivisaCasa.objects.all(
        ).select_related('denominacion__divisa')

        response_data = {
            "tauser": self._serialize_stock(
                tauser_stock, tauser_record),
            "casa": self._serialize_stock(casa_stock),
        }
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        """
        Devuelve los detalles (denominaciones y cantidades) de un movimiento.
        """
        movimiento = self.get_object()
        detalles = movimiento.movimientostockdetalle_set.select_related('denominacion')
        data = [
            {
                "denominacion": d.denominacion.denominacion,
                "cantidad": d.cantidad
            }
            for d in detalles
        ]
        return Response(data)

    def _parse_datetime_param(self, value, end=False):
        if not value:
            return None

        dt = parse_datetime(value)
        if not dt:
            date_value = parse_date(value)
            if not date_value:
                return None
            dt = datetime.combine(
                date_value,
                time.max if end else time.min
            )

        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())

        if end:
            # Ajustar para incluir el extremo superior
            dt = dt.replace(microsecond=999999)

        return dt

    def _serialize_stock(self, queryset, tauser=None):
        detalle = []
        totales = OrderedDict()

        for item in queryset:
            denominacion = item.denominacion
            divisa = denominacion.divisa
            detalle.append({
                "stock_id": item.id,
                "denominacion_id": denominacion.id,
                "denominacion_valor": denominacion.denominacion,
                "divisa_id": divisa.id,
                "divisa_codigo": divisa.codigo,
                "divisa_nombre": divisa.nombre,
                "cantidad": item.stock,
            })

            if divisa.id not in totales:
                totales[divisa.id] = {
                    "divisa_id": divisa.id,
                    "divisa_codigo": divisa.codigo,
                    "divisa_nombre": divisa.nombre,
                    "monto": Decimal('0')
                }

            totales[divisa.id]["monto"] += Decimal(
                str(denominacion.denominacion)) * Decimal(item.stock)

        payload = {
            "detalle": detalle,
            "totales": [
                {
                    **info,
                    "monto": str(info["monto"])
                }
                for info in totales.values()
            ]
        }

        if tauser:
            payload["tauser_info"] = TauserSerializer(tauser).data

        return payload
