from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import SimulacionSerializer
from .services import calcular_conversion
from apps.operaciones.models import MetodoFinanciero
from apps.operaciones.serializers import MetodoFinancieroSerializer

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
            metodo_id=data["metodo_id"],
            operacion=data["operacion"]
        )
        return Response(resultado, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET"])
def listar_metodos_disponibles(request):
    operacion = request.query_params.get("operacion")
    if operacion not in ["compra", "venta"]:
        return Response({"error": "Operación inválida"}, status=400)

    # Si la casa COMPRA divisa → cliente VENDE → la casa PAGA
    # Necesitamos métodos que permitan **pago**
    if operacion == "compra":
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_pago=True)

    # Si la casa VENDE divisa → cliente COMPRA → la casa COBRA
    # Necesitamos métodos que permitan **cobro**
    else:
        metodos = MetodoFinanciero.objects.filter(is_active=True, permite_cobro=True)

    serializer = MetodoFinancieroSerializer(metodos, many=True)
    return Response(serializer.data)