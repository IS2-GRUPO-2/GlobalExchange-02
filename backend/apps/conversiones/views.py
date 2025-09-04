from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import SimulacionSerializer
from .services import calcular_conversion

class ConversionViewSet(viewsets.ViewSet):
    """
    ViewSet para simulación de conversiones de divisas.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="simular")
    def simular(self, request):
        serializer = SimulacionSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            resultado = calcular_conversion(
                cliente_id=data["cliente_id"],
                divisa_id=data["divisa_id"],
                monto=float(data["monto"]),
                metodo_pago=data["metodo_pago"],
                operacion=data["operacion"]
            )
            return Response(resultado, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
