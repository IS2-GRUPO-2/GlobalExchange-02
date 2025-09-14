"""
Vistas de la aplicación de simulación.
Exponen la lógica de servicios a través de endpoints REST.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import SimulacionPrivadaSerializer, SimulacionPublicaSerializer
from .services import (
    calcular_conversion,
    calcular_conversion_publica,
    listar_metodos_por_divisas,
)
from apps.operaciones.serializers import MetodoFinancieroSerializer


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def simular_conversion(request):
    """
    Endpoint de simulación privada (requiere login y cliente).
    - Recibe datos de conversión + cliente_id.
    - Devuelve resultado detallado con descuentos de categoría y comisiones.
    """
    serializer = SimulacionPrivadaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            resultado = calcular_conversion(
                cliente_id=data["cliente_id"],
                divisa_origen_id=data["divisa_origen"],
                divisa_destino_id=data["divisa_destino"],
                monto=data["monto"],
                metodo_id=data["metodo_id"],
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def simular_conversion_publica(request):
    """
    Endpoint de simulación pública (landing page).
    - No requiere login ni cliente.
    - Devuelve resultado usando tasas y comisiones base.
    """
    serializer = SimulacionPublicaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            resultado = calcular_conversion_publica(
                divisa_origen_id=data["divisa_origen"],
                divisa_destino_id=data["divisa_destino"],
                monto=data["monto"],
                metodo_id=data["metodo_id"],
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def listar_metodos_disponibles(request):
    """
    Endpoint que lista los métodos disponibles según divisa_origen y divisa_destino.
    - El backend infiere si la operación es compra o venta.
    - Devuelve { operacion_casa, metodos[] }.
    """
    try:
        divisa_origen = request.query_params.get("divisa_origen")
        divisa_destino = request.query_params.get("divisa_destino")

        if not divisa_origen or not divisa_destino:
            return Response({"error": "Debe indicar divisa_origen y divisa_destino"}, status=400)

        if divisa_origen == divisa_destino:
            return Response(
                {"error": "La divisa de origen y destino no pueden ser iguales."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        operacion_casa, metodos = listar_metodos_por_divisas(divisa_origen, divisa_destino)

        serializer = MetodoFinancieroSerializer(metodos, many=True)
        return Response(
            {
                "operacion_casa": operacion_casa,
                "metodos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)