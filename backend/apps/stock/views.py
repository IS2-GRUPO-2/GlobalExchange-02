from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from . import serializers
from . import models

class MovimientoStockViewset(viewsets.ModelViewSet):
    """
    ViewSet para registrar y listar movimientos de stock de tausers.
    """
    queryset = models.MovimientoStock.objects.all().select_related(
        'tipo_movimiento', 'tauser', 'transaccion', 'estado'
    )
    serializer_class = serializers.MovimientoStockSerializer
    permission_classes = [permissions.AllowAny]#[permissions.IsAuthenticated, permissions.DjangoModelPermissions]

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