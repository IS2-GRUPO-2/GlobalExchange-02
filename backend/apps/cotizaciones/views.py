"""
Módulo de vistas para la gestión de tasas de divisas.

Define el ViewSet principal para exponer operaciones CRUD sobre tasas,
junto con un endpoint público para la consulta de cotizaciones activas.
"""
from rest_framework import viewsets, permissions, filters
from apps.cotizaciones.models import Tasa
from apps.cotizaciones.serializers import TasaSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.cotizaciones.service import TasaService
from apps.divisas.models import Divisa
from rest_framework.permissions import DjangoModelPermissions



class TasaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de tasas.
    
    Permite gestionar tasas asociadas a divisas, aplicando eliminación lógica,
    búsqueda por código/nombre de divisa y acceso controlado mediante permisos.
    
    Endpoints personalizados:
        - public_rates: Retorna las tasas activas en formato simplificado
          para su uso en vistas públicas (ej. landing page).
    """
    queryset = Tasa.objects.select_related("divisa").all()
    serializer_class = TasaSerializer

    permission_classes = [permissions.AllowAny, DjangoModelPermissions]


    filter_backends = [filters.SearchFilter]
    search_fields = ["divisa__codigo", "divisa__nombre"]

    def perform_destroy(self, instance):
        """
        Elimina lógicamente una tasa, marcándola como inactiva.
        
        Args:
            instance (Tasa): Instancia de la tasa a desactivar.
        """
        instance.activo = False
        instance.save()

    @swagger_auto_schema(
        operation_summary="Cotizaciones públicas",
        operation_description="Devuelve cotizaciones activas en formato simplificado para landing page",
        responses={200: openapi.Response("Listado de cotizaciones públicas")}
    )
    @action(detail=False, methods=["get"], url_path="public", permission_classes=[permissions.AllowAny])
    def public_rates(self, request):
        """
        Endpoint para vista pública (landing page).
        
        Devuelve un listado de cotizaciones activas con los campos:
            - codigo: Código de la divisa (ej. USD).
            - nombre: Nombre de la divisa (ej. Dólar estadounidense).
            - simbolo: Símbolo de la divisa base.
            - compra: Valor de la tasa de compra.
            - venta: Valor de la tasa de venta.
            - flag: Emoji representativo de la bandera asociada.
        
        Returns:
            Response: Lista de cotizaciones activas en formato simplificado.
        """
        tasas = (
            Tasa.objects.filter(activo=True, divisa__is_active=True)
            .select_related("divisa")
        )
        simboloBase = Divisa.objects.filter(es_base=True).first().simbolo

        data = []
        for t in tasas:
            data.append({
                "codigo": t.divisa.codigo,
                "nombre": t.divisa.nombre,
                "simbolo": simboloBase,
                "compra": str(TasaService.calcular_tasa_compra(t)),
                "venta": str(TasaService.calcular_tasa_venta(t)),
                "flag": "🇺🇸" if t.divisa.codigo == "USD"
                        else "🇪🇺" if t.divisa.codigo == "EUR"
                        else "🇧🇷" if t.divisa.codigo == "BRL"
                        else "🇦🇷" if t.divisa.codigo == "ARS"
                        else "🇵🇾" if t.divisa.codigo == "PYG"
                        else "🇺🇾" if t.divisa.codigo == "UYU"
                        else "🇲🇽" if t.divisa.codigo == "MXN"
                        else "🇵🇾"

            })
        return Response(data)
