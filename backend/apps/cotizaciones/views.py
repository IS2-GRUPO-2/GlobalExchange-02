"""
Módulo de vistas para la gestión de tasas de divisas.

Define el ViewSet principal para exponer operaciones CRUD sobre tasas,
junto con endpoints públicos para la consulta de cotizaciones activas y su
historial.
"""
from datetime import datetime, time

from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from apps.cotizaciones.models import Tasa, HistorialTasa
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
        simbolo_base = (
            Divisa.objects.filter(es_base=True)
            .values_list("simbolo", flat=True)
            .first()
        ) or "₲"

        data = []
        for t in tasas:
            data.append({
                "codigo": t.divisa.codigo,
                "nombre": t.divisa.nombre,
                "simbolo": simbolo_base,
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

    @swagger_auto_schema(
        operation_summary="Historial público de cotizaciones",
        operation_description="Devuelve los puntos históricos de compra y venta para una divisa específica",
        manual_parameters=[
            openapi.Parameter(
                "divisa",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=True,
                description="Código de la divisa (ej. USD)",
            ),
            openapi.Parameter(
                "start",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Fecha inicial (YYYY-MM-DD)",
            ),
            openapi.Parameter(
                "end",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Fecha final (YYYY-MM-DD)",
            ),
        ],
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="public/history",
        permission_classes=[permissions.AllowAny],
    )
    def public_history(self, request):
        divisa_codigo = request.query_params.get("divisa")
        if not divisa_codigo:
            return Response(
                {"detail": "El parámetro 'divisa' es obligatorio."},
                status=400,
            )

        def _parse_date(raw_value: str, *, is_end=False):
            try:
                parsed = datetime.strptime(raw_value, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("El formato de fecha debe ser YYYY-MM-DD")

            dt = datetime.combine(parsed, time.max if is_end else time.min)
            return (
                timezone.make_aware(dt, timezone.get_current_timezone())
                if timezone.is_naive(dt)
                else dt
            )

        try:
            divisa = Divisa.objects.get(
                codigo__iexact=divisa_codigo, is_active=True
            )
        except Divisa.DoesNotExist:
            return Response(
                {"detail": "Divisa no encontrada o inactiva."},
                status=404,
            )

        tasa = (
            Tasa.objects.filter(divisa=divisa, activo=True)
            .select_related("divisa")
            .first()
        )
        if not tasa:
            return Response(
                {"detail": "La divisa no tiene una cotización activa."},
                status=404,
            )

        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")

        try:
            start_dt = _parse_date(start_param) if start_param else None
            end_dt = (
                _parse_date(end_param, is_end=True) if end_param else None
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        if start_dt and end_dt and start_dt > end_dt:
            return Response(
                {"detail": "La fecha inicial debe ser menor o igual a la final."},
                status=400,
            )

        historial = HistorialTasa.objects.filter(tasa=tasa)
        if start_dt:
            historial = historial.filter(fechaCreacion__gte=start_dt)
        if end_dt:
            historial = historial.filter(fechaCreacion__lte=end_dt)

        historial = historial.order_by("fechaCreacion")

        base_divisa = (
            Divisa.objects.filter(es_base=True)
            .values("codigo", "nombre", "simbolo")
            .first()
        )

        puntos = [
            {
                "fecha": timezone.localtime(item.fechaCreacion).isoformat(),
                "tasaCompra": str(item.tasaCompra),
                "tasaVenta": str(item.tasaVenta),
            }
            for item in historial
        ]

        return Response(
            {
                "divisa": {
                    "codigo": divisa.codigo,
                    "nombre": divisa.nombre,
                },
                "base": base_divisa,
                "points": puntos,
            }
        )
