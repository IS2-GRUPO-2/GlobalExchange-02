import requests
from globalexchange.configuration import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .models import Factura
from apps.operaciones.models import Transaccion
class DescargarFacturaPDFView(APIView):
    def get(self, request, transaccion_id):
        try:
            transaccion = Transaccion.objects.get(pk=transaccion_id)

            factura_asociada = Factura.objects.get(transaccion=transaccion)
            api_url = f"{config.FACTURA_SEGURA_URL}/misife00/v1/esi/dwn_kude/2595733/{factura_asociada.cdc}"
            print(api_url)
            headers = {
            "Authentication-Token": f"{config.FACTURASEGURA_API_KEY}"
            }

            resp = requests.get(api_url, headers=headers)
            if resp.status_code == 200:
                response = HttpResponse(
                    resp.content,
                    content_type="application/pdf"
                )
                response["Content-Disposition"] = f'attachment; filename="{factura_asociada.cdc}.pdf"'
                return response
            else:
                return Response(
                    {"error": f"Error al obtener PDF: {resp.status_code}"},
                    status=resp.status_code
                )
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Transaccion.DoesNotExist:
            return Response({"error": "La transaccion no existe"}, status=status.HTTP_404_NOT_FOUND)
        except Factura.DoesNotExist:
            return Response({"error": "La transaccion no tiene factura asociada"}, status=status.HTTP_404_NOT_FOUND)