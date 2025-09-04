"""
Módulo de vistas para la gestión de métodos financieros y sus detalles.

Proporciona ViewSets para CRUD sobre el catálogo central de métodos
financieros (`MetodoFinanciero`) y sus implementaciones específicas
(`MetodoFinancieroDetalle`, `CuentaBancaria`, `BilleteraDigital`, `Tarjeta`).

Las operaciones de eliminación aplican eliminación lógica (soft-delete)
marcando `is_active=False` en el registro correspondiente.
"""

from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.http import Http404
from .models import (
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
)
from .serializers import (
    MetodoFinancieroSerializer,
    MetodoFinancieroDetalleSerializer,
    CuentaBancariaSerializer,
    BilleteraDigitalSerializer,
    TarjetaSerializer,
)


class MetodoFinancieroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de métodos financieros.

    Proporciona endpoints estándar para crear, leer, actualizar y eliminar
    métodos financieros del catálogo central.

    Nota sobre permisos:
        Actualmente limitado a administradores mediante `IsAdminUser`.
        Ajustar `permission_classes` si se desea exponer list/retrieve a
        usuarios autenticados.
    """
    queryset = MetodoFinanciero.objects.filter(is_active=True)
    serializer_class = MetodoFinancieroSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']

    def destroy(self, request, *args, **kwargs):
        """
        Desactivación lógica del método financiero.

        En lugar de eliminar físicamente el registro, marca `is_active=False`.

        Returns:
            Response: Mensaje de confirmación o 404 si ya estaba desactivado.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "El método financiero ya está desactivado."},
                status=status.HTTP_404_NOT_FOUND
            )
        instance.is_active = False
        instance.save()
        return Response(
            {"message": f"Método financiero {instance.get_nombre_display()} desactivado (eliminado lógico)."},
            status=status.HTTP_200_OK
        )


class MetodoFinancieroDetalleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de detalles de métodos financieros.

    Gestiona las instancias específicas de métodos financieros registrados
    tanto para clientes como para la casa de cambio.

    Campos importantes:
        - `es_cuenta_casa`: determina si el detalle pertenece a la casa de cambio.
        - `alias`: identificador legible del detalle.
    """
    queryset = MetodoFinancieroDetalle.objects.filter(is_active=True)
    serializer_class = MetodoFinancieroDetalleSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['alias', 'cliente__nombre']

    def destroy(self, request, *args, **kwargs):
        """Desactivación lógica del detalle de método financiero.

        Aquí se marca `is_active=False` en el registro en lugar de eliminarlo
        físicamente. Devuelve 404 si ya estaba desactivado.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response({"detail": "El detalle de método financiero ya está desactivado."}, status=status.HTTP_404_NOT_FOUND)

        instance.is_active = False
        instance.save()
        return Response({"message": f"Detalle de método financiero {instance.alias} desactivado (eliminado lógico)."}, status=status.HTTP_200_OK)


class CuentaBancariaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de cuentas bancarias.

    Gestiona los detalles específicos de cuentas bancarias asociadas
    a métodos financieros. Las cuentas bancarias están relacionadas por
    `metodo_financiero_detalle`.
    """
    queryset = CuentaBancaria.objects.filter(metodo_financiero_detalle__is_active=True)
    serializer_class = CuentaBancariaSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['banco', 'numero_cuenta', 'titular', 'cbu_cvu']

    def destroy(self, request, *args, **kwargs):
        """Desactivación lógica de la cuenta bancaria a través de su detalle.

        Para las entidades específicas (cuenta, billetera, tarjeta) la
        eliminación lógica se realiza marcando el `MetodoFinancieroDetalle`
        asociado como inactivo.
        """
        instance = self.get_object()
        detalle = instance.metodo_financiero_detalle
        if not detalle.is_active:
            return Response({"detail": "La cuenta bancaria ya está desactivada."}, status=status.HTTP_404_NOT_FOUND)

        detalle.is_active = False
        detalle.save()
        return Response({"message": f"Cuenta bancaria {instance.banco} - {instance.numero_cuenta} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)


class BilleteraDigitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de billeteras digitales.

    Gestiona los detalles específicos de billeteras digitales asociadas
    a métodos financieros.
    """
    queryset = BilleteraDigital.objects.filter(metodo_financiero_detalle__is_active=True)
    serializer_class = BilleteraDigitalSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['plataforma', 'usuario_id', 'email', 'telefono']

    def destroy(self, request, *args, **kwargs):
        """Desactivación lógica de la billetera digital a través de su detalle.

        Marca el `MetodoFinancieroDetalle` asociado como inactivo.
        """
        instance = self.get_object()
        detalle = instance.metodo_financiero_detalle
        if not detalle.is_active:
            return Response({"detail": "La billetera digital ya está desactivada."}, status=status.HTTP_404_NOT_FOUND)

        detalle.is_active = False
        detalle.save()
        return Response({"message": f"Billetera digital {instance.plataforma} - {instance.usuario_id} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)


class TarjetaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de tarjetas de crédito/débito.

    Gestiona los detalles específicos de tarjetas asociadas
    a métodos financieros.
    """
    queryset = Tarjeta.objects.filter(metodo_financiero_detalle__is_active=True)
    serializer_class = TarjetaSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['brand', 'last4', 'titular']

    def destroy(self, request, *args, **kwargs):
        """Desactivación lógica de la tarjeta a través de su detalle.

        Marca el `MetodoFinancieroDetalle` asociado como inactivo.
        """
        instance = self.get_object()
        detalle = instance.metodo_financiero_detalle
        if not detalle.is_active:
            return Response({"detail": "La tarjeta ya está desactivada."}, status=status.HTTP_404_NOT_FOUND)

        detalle.is_active = False
        detalle.save()
        return Response({"message": f"Tarjeta {instance.brand} ****{instance.last4} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)
