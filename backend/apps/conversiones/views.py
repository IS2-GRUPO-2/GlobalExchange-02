from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import SimulacionSerializer
from .services import calcular_conversion

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def simular_conversion(request):
    print("Hola")
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
