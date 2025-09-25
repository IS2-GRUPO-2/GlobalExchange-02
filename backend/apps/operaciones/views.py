"""
Módulo de vistas para la gestión de métodos financieros y sus detalles.

Proporciona ViewSets para CRUD sobre el catálogo central de métodos
financieros (`MetodoFinanciero`) y sus implementaciones específicas
(`MetodoFinancieroDetalle`, `CuentaBancaria`, `BilleteraDigital`, `Tarjeta`).

"""

from rest_framework import viewsets, status, filters, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import (
    Banco,
    BilleteraDigitalCatalogo,
    TarjetaLocalCatalogo,
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    TarjetaLocal,
    Cheque,
    Transaccion
)
from .serializers import (
    BancoSerializer,
    BilleteraDigitalCatalogoSerializer,
    TarjetaLocalCatalogoSerializer,
    ChequeSerializer,
    MetodoFinancieroSerializer,
    MetodoFinancieroDetalleSerializer,
    CuentaBancariaSerializer,
    BilleteraDigitalSerializer,
    TarjetaSerializer,
    TarjetaLocalSerializer,
    SimulacionPrivadaSerializer,
    SimulacionPrivadaConInstanciaSerializer,
    SimulacionPublicaSerializer,
    MetodosClienteSerializer,
    TransaccionSerializer,
    TransaccionCreateSerializer,
    TransaccionOperacionSerializer
)
from .services import (
    calcular_simulacion_operacion_publica,
    calcular_simulacion_operacion_privada,
    calcular_simulacion_operacion_privada_con_instancia,
    listar_metodos_por_divisas,
    listar_metodos_cliente_por_divisas,
    crear_transaccion_desde_simulacion
)



class OperacionesPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class BancoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD del catálogo de bancos.

    Proporciona endpoints para gestionar los bancos disponibles en el sistema.
    Solo los administradores pueden crear, actualizar o eliminar bancos.
    """
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']
    pagination_class = OperacionesPagination

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        """
        Desactivación lógica del banco.

        En lugar de eliminar físicamente el registro, marca `is_active=False`.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "El banco ya está desactivado."},
                status=status.HTTP_404_NOT_FOUND
            )
        instance.is_active = False
        instance.save()
        return Response(
            {"message": f"Banco {instance.nombre} desactivado (eliminado lógico)."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """
        Alterna el estado de activación del banco (activo/inactivo).
        
        Solo los administradores pueden usar esta funcionalidad.
        """
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save()
        
        # Si se desactiva, desactivar también todas las cuentas bancarias relacionadas
        affected_instances = []
        if not instance.is_active:
            from .models import CuentaBancaria
            cuentas_relacionadas = CuentaBancaria.objects.filter(
                banco=instance,
                metodo_financiero_detalle__is_active=True
            )
            
            for cuenta in cuentas_relacionadas:
                cuenta.metodo_financiero_detalle.is_active = False
                cuenta.metodo_financiero_detalle.desactivado_por_catalogo = True
                cuenta.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': cuenta.id,
                    'tipo': 'cuenta',
                    'titular': cuenta.titular
                })
        else:
            # Si se reactiva el banco, permitir reactivar cuentas que fueron desactivadas por catálogo
            from .models import CuentaBancaria
            cuentas_relacionadas = CuentaBancaria.objects.filter(
                banco=instance,
                metodo_financiero_detalle__is_active=False,
                metodo_financiero_detalle__desactivado_por_catalogo=True
            )
            
            for cuenta in cuentas_relacionadas:
                cuenta.metodo_financiero_detalle.is_active = True
                cuenta.metodo_financiero_detalle.desactivado_por_catalogo = False
                cuenta.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': cuenta.id,
                    'tipo': 'cuenta',
                    'titular': cuenta.titular
                })
        
        estado = "activado" if instance.is_active else "desactivado"
        response_data = {
            "message": f"Banco {instance.nombre} {estado}.",
            "is_active": instance.is_active,
            "affected_instances": affected_instances
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class BilleteraDigitalCatalogoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD del catálogo de billeteras digitales.

    Proporciona endpoints para gestionar las billeteras digitales disponibles en el sistema.
    Solo los administradores pueden crear, actualizar o eliminar billeteras.
    """
    queryset = BilleteraDigitalCatalogo.objects.all()
    serializer_class = BilleteraDigitalCatalogoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']
    pagination_class = OperacionesPagination

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        """
        Desactivación lógica de la billetera digital.

        En lugar de eliminar físicamente el registro, marca `is_active=False`.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "La billetera digital ya está desactivada."},
                status=status.HTTP_404_NOT_FOUND
            )
        instance.is_active = False
        instance.save()
        return Response(
            {"message": f"Billetera digital {instance.nombre} desactivada (eliminado lógico)."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """
        Alterna el estado de activación de la billetera digital (activo/inactivo).
        
        Solo los administradores pueden usar esta funcionalidad.
        """
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save()
        
        # Si se desactiva, desactivar también todas las billeteras digitales relacionadas
        affected_instances = []
        if not instance.is_active:
            from .models import BilleteraDigital
            billeteras_relacionadas = BilleteraDigital.objects.filter(
                plataforma=instance,
                metodo_financiero_detalle__is_active=True
            )
            
            for billetera in billeteras_relacionadas:
                billetera.metodo_financiero_detalle.is_active = False
                billetera.metodo_financiero_detalle.desactivado_por_catalogo = True
                billetera.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': billetera.id,
                    'tipo': 'billetera',
                    'usuario_id': billetera.usuario_id
                })
        else:
            # Si se reactiva la billetera digital, permitir reactivar billeteras que fueron desactivadas por catálogo
            from .models import BilleteraDigital
            billeteras_relacionadas = BilleteraDigital.objects.filter(
                plataforma=instance,
                metodo_financiero_detalle__is_active=False,
                metodo_financiero_detalle__desactivado_por_catalogo=True
            )
            
            for billetera in billeteras_relacionadas:
                billetera.metodo_financiero_detalle.is_active = True
                billetera.metodo_financiero_detalle.desactivado_por_catalogo = False
                billetera.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': billetera.id,
                    'tipo': 'billetera',
                    'usuario_id': billetera.usuario_id
                })
        
        estado = "activado" if instance.is_active else "desactivado"
        response_data = {
            "message": f"Billetera digital {instance.nombre} {estado}.",
            "is_active": instance.is_active,
            "affected_instances": affected_instances
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class TarjetaLocalCatalogoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD del catálogo de marcas de tarjetas locales.

    Proporciona endpoints para gestionar las marcas de tarjetas locales disponibles en el sistema.
    Solo los administradores pueden crear, actualizar o eliminar marcas.
    """
    queryset = TarjetaLocalCatalogo.objects.all()
    serializer_class = TarjetaLocalCatalogoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['marca']
    pagination_class = OperacionesPagination

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        """
        Desactivación lógica de la marca de tarjeta local.

        En lugar de eliminar físicamente el registro, marca `is_active=False`.
        """
        instance = self.get_object()
        if not instance.is_active:
            return Response(
                {"detail": "La marca de tarjeta local ya está desactivada."},
                status=status.HTTP_404_NOT_FOUND
            )
        instance.is_active = False
        instance.save()
        return Response(
            {"message": f"Marca de tarjeta local {instance.marca} desactivada (eliminado lógico)."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """
        Alterna el estado de activación de la marca de tarjeta local (activo/inactivo).
        
        Solo los administradores pueden usar esta funcionalidad.
        """
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save()
        
        # Si se desactiva, desactivar también todas las tarjetas locales relacionadas
        affected_instances = []
        if not instance.is_active:
            from .models import TarjetaLocal
            tarjetas_relacionadas = TarjetaLocal.objects.filter(
                marca=instance,
                metodo_financiero_detalle__is_active=True
            )
            
            for tarjeta in tarjetas_relacionadas:
                tarjeta.metodo_financiero_detalle.is_active = False
                tarjeta.metodo_financiero_detalle.desactivado_por_catalogo = True
                tarjeta.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': tarjeta.id,
                    'tipo': 'tarjeta_local',
                    'titular': tarjeta.titular
                })
        else:
            # Si se reactiva la marca, permitir reactivar tarjetas que fueron desactivadas por catálogo
            from .models import TarjetaLocal
            tarjetas_relacionadas = TarjetaLocal.objects.filter(
                marca=instance,
                metodo_financiero_detalle__is_active=False,
                metodo_financiero_detalle__desactivado_por_catalogo=True
            )
            
            for tarjeta in tarjetas_relacionadas:
                tarjeta.metodo_financiero_detalle.is_active = True
                tarjeta.metodo_financiero_detalle.desactivado_por_catalogo = False
                tarjeta.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': tarjeta.id,
                    'tipo': 'tarjeta_local',
                    'titular': tarjeta.titular
                })
        
        estado = "activado" if instance.is_active else "desactivado"
        response_data = {
            "message": f"Marca de tarjeta local {instance.marca} {estado}.",
            "is_active": instance.is_active,
            "affected_instances": affected_instances
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class MetodoFinancieroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de métodos financieros.

    Proporciona endpoints estándar para crear, leer, actualizar y eliminar
    métodos financieros del catálogo central.

    Nota sobre permisos:
        Permite a usuarios autenticados ver la lista pero requiere admin para modificar.
    """
    queryset = MetodoFinanciero.objects.all()
    serializer_class = MetodoFinancieroSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']
    pagination_class = OperacionesPagination

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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
        - `is_active`: estado del método financiero (activo/inactivo).
    """
    queryset = MetodoFinancieroDetalle.objects.all()
    serializer_class = MetodoFinancieroDetalleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['alias', 'cliente__nombre']
    pagination_class = OperacionesPagination

    def get_queryset(self):
        """
        Filtrar detalles según permisos del usuario.
        
        - Administradores: ven todos los registros (activos e inactivos)
        - Usuarios regulares: ven sus propios registros (activos e inactivos)
        """
        queryset = MetodoFinancieroDetalle.objects.all()
        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            # Administradores ven todos los registros
            return queryset.filter(es_cuenta_casa=True)
        else:
            # Usuarios regulares ven los registros de sus clientes asignados (activos e inactivos)
            return queryset.filter(cliente__in=self.request.user.clientes.all())

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo admins pueden editar/eliminar detalles de métodos financieros
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Usuarios autenticados pueden ver y crear sus propios métodos financieros
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Asigna automáticamente el cliente cuando un usuario no-admin crea un método financiero.
        """
        if not (self.request.user.has_perm('operaciones.add_metodofinanciero')):
            # Para usuarios no-admin, asignar automáticamente el primer cliente asignado
            clientes = self.request.user.clientes.all()
            if clientes.exists():
                serializer.save(cliente=clientes.first())
            else:
                # Si no tiene clientes asignados, devolver error
                raise PermissionDenied("No tienes clientes asignados para crear métodos financieros.")
        else:
            # Para admins, usar el cliente especificado en los datos
            serializer.save()

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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """
        Alterna el estado de activación del método financiero (activo/inactivo).
        
        - Los administradores pueden activar/desactivar cualquier método.
        - Los usuarios regulares pueden:
          * Desactivar sus propios métodos financieros
          * Reactivar solo aquellos que ellos mismos desactivaron (no los desactivados por catálogo)
        """
        instance = self.get_object()
        
        # Verificar permisos para usuarios no-admin
        if not (self.request.user.has_perm('operaciones.change_metodofinanciero')):
            # Verificar que el método financiero pertenece al usuario
            if instance.cliente not in self.request.user.clientes.all():
                raise PermissionDenied("No tienes permisos para modificar este método financiero.")
            
            # Si está intentando reactivar un método desactivado por catálogo, denegar
            if not instance.is_active and instance.desactivado_por_catalogo:
                return Response({
                    "error": "No puedes reactivar este método financiero porque fue desactivado por desactivación del catálogo (banco o billetera digital). Contacta al administrador."
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Realizar el toggle
        instance.is_active = not instance.is_active
        
        # Si el usuario regular está desactivando, asegurarse de que no sea por catálogo
        if not instance.is_active and not (self.request.user.has_perm('operaciones.change_metodofinanciero')):
            instance.desactivado_por_catalogo = False
        
        instance.save()
        
        estado = "activado" if instance.is_active else "desactivado"
        return Response({
            "message": f"Detalle de método financiero {instance.alias} {estado}.",
            "is_active": instance.is_active
        }, status=status.HTTP_200_OK)


class CuentaBancariaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de cuentas bancarias.

    Gestiona los detalles específicos de cuentas bancarias asociadas
    a métodos financieros. Las cuentas bancarias están relacionadas por
    `metodo_financiero_detalle`.
    """
    queryset = CuentaBancaria.objects.all()
    serializer_class = CuentaBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['banco__nombre', 'numero_cuenta', 'titular', 'cbu_cvu']
    pagination_class = OperacionesPagination

    def get_queryset(self):
        """
        Filtrar cuentas según permisos del usuario.
        
        - Administradores: ven todas las cuentas
        - Usuarios regulares: solo ven sus propias cuentas
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = CuentaBancaria.objects.select_related('metodo_financiero_detalle', 'banco').all()
        
        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            return queryset.filter(metodo_financiero_detalle__es_cuenta_casa=True)
        else:
            # Usuarios regulares ven las cuentas de sus clientes asignados
            return queryset.filter(
                metodo_financiero_detalle__cliente__in=self.request.user.clientes.all()
            )

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo admins pueden editar/eliminar cuentas bancarias
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Usuarios autenticados pueden ver y crear sus propias cuentas bancarias
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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
        return Response({"message": f"Cuenta bancaria {instance.banco.nombre} - {instance.numero_cuenta} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)


class BilleteraDigitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de billeteras digitales.

    Gestiona los detalles específicos de billeteras digitales asociadas
    a métodos financieros.
    """
    queryset = BilleteraDigital.objects.all()
    serializer_class = BilleteraDigitalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['plataforma__nombre', 'usuario_id', 'email', 'telefono']
    pagination_class = OperacionesPagination

    def get_queryset(self):
        """
        Filtrar billeteras según permisos del usuario.
        
        - Administradores: ven todas las billeteras
        - Usuarios regulares: solo ven sus propias billeteras
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = BilleteraDigital.objects.select_related('metodo_financiero_detalle', 'plataforma').all()
        
        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            return queryset.filter(metodo_financiero_detalle__es_cuenta_casa=True)
        else:
            # Usuarios regulares ven las billeteras de sus clientes asignados
            return queryset.filter(
                metodo_financiero_detalle__cliente__in=self.request.user.clientes.all()
            )

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo admins pueden editar/eliminar billeteras digitales
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Usuarios autenticados pueden ver y crear sus propias billeteras digitales
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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
        return Response({"message": f"Billetera digital {instance.plataforma.nombre} - {instance.usuario_id} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)


class TarjetaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de tarjetas de crédito/débito.

    Gestiona los detalles específicos de tarjetas asociadas
    a métodos financieros.
    """
    queryset = Tarjeta.objects.all()
    serializer_class = TarjetaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['brand', 'last4', 'titular']
    pagination_class = OperacionesPagination

    def get_queryset(self):
        """
        Filtrar tarjetas según permisos del usuario.
        
        - Administradores: ven todas las tarjetas
        - Usuarios regulares: solo ven sus propias tarjetas
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = Tarjeta.objects.select_related('metodo_financiero_detalle').all()

        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            return queryset.filter(metodo_financiero_detalle__es_cuenta_casa=True)
        else:
            # Usuarios regulares ven las tarjetas de sus clientes asignados
            return queryset.filter(
                metodo_financiero_detalle__cliente__in=self.request.user.clientes.all()
            )

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo admins pueden editar/eliminar tarjetas
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Usuarios autenticados pueden ver y crear sus propias tarjetas
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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


class TarjetaLocalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de tarjetas locales.

    Gestiona los detalles específicos de tarjetas locales asociadas
    a métodos financieros.
    """
    queryset = TarjetaLocal.objects.all()
    serializer_class = TarjetaLocalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['marca__marca', 'last4', 'titular']
    pagination_class = OperacionesPagination

    def get_queryset(self):
        """
        Filtrar tarjetas locales según permisos del usuario.
        
        - Administradores: ven todas las tarjetas locales
        - Usuarios regulares: solo ven sus propias tarjetas locales
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = TarjetaLocal.objects.select_related('metodo_financiero_detalle', 'marca').all()

        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            return queryset.filter(metodo_financiero_detalle__es_cuenta_casa=True)
        else:
            # Usuarios regulares ven las tarjetas locales de sus clientes asignados
            return queryset.filter(
                metodo_financiero_detalle__cliente__in=self.request.user.clientes.all()
            )

    def get_permissions(self):
        """
        Instancia y retorna la lista de permisos que requiere esta vista.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo admins pueden editar/eliminar tarjetas locales
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Usuarios autenticados pueden ver y crear sus propias tarjetas locales
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        """Desactivación lógica de la tarjeta local a través de su detalle.

        Marca el `MetodoFinancieroDetalle` asociado como inactivo.
        """
        instance = self.get_object()
        detalle = instance.metodo_financiero_detalle
        if not detalle.is_active:
            return Response({"detail": "La tarjeta local ya está desactivada."}, status=status.HTTP_404_NOT_FOUND)

        detalle.is_active = False
        detalle.save()
        return Response({"message": f"Tarjeta local {instance.marca.marca} ****{instance.last4} desactivada (eliminado lógico)."}, status=status.HTTP_200_OK)
    
class ChequeViewSet(viewsets.ModelViewSet):
    queryset = Cheque.objects.all()
    serializer_class = ChequeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    # Ajuste: los nombres de campo deben coincidir con el modelo
    search_fields = ['banco_emisor__nombre', 'numero', 'titular']
    pagination_class = OperacionesPagination
    

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def obtener_tipos_cheque(request):
    """
    Retorna la lista de tipos de cheque admitidos por el sistema.

    Devuelve una lista de objetos { value, label } usando las choices
    definidas en el campo `tipo` del modelo `Cheque`.
    """
    try:
        choices = [
            {"value": c[0], "label": c[1]} for c in Cheque._meta.get_field('tipo').choices
        ]
        return Response(choices, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def obtener_divisas_cheque(request):
    """
    Retorna las divisas permitidas para cheques.

    Devuelve una lista de objetos { value, label } usando la constante
    `DIVISAS_PERMITIDAS` definida en el modelo `Cheque`.
    """
    try:
        divisas = [{"value": d[0], "label": d[1]} for d in getattr(Cheque, 'DIVISAS_PERMITIDAS', [])]
        return Response(divisas, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

   

#=============================================================
# Vistas para simulaciones de operaciones
#=============================================================

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def simular_operacion_privada(request):
    """
    Endpoint de simulación privada (requiere login y cliente).
    - Recibe datos de op con cliente_id.
    - Devuelve resultado detallado con descuentos de categoría y comisiones.
    """
    serializer = SimulacionPrivadaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            resultado = calcular_simulacion_operacion_privada(
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
def simular_operacion_publica(request):
    """
    Endpoint de simulación pública (landing page).
    - No requiere login ni cliente.
    - Devuelve resultado usando tasas y comision de metodo financiero.
    """
    serializer = SimulacionPublicaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            resultado = calcular_simulacion_operacion_publica(
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
    


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def simular_operacion_privada_con_instancia(request):
    """
    Endpoint de simulación privada con instancia específica.
    - Puede recibir detalle_metodo_id (instancia específica) o metodo_id (método genérico).
    - Devuelve resultado detallado con descuentos de categoría y comisiones.
    """
    serializer = SimulacionPrivadaConInstanciaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            resultado = calcular_simulacion_operacion_privada_con_instancia(
                cliente_id=data["cliente_id"],
                divisa_origen_id=data["divisa_origen"],
                divisa_destino_id=data["divisa_destino"],
                monto=data["monto"],
                detalle_metodo_id=data.get("detalle_metodo_id"),
                metodo_id=data.get("metodo_id"),
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def listar_metodos_cliente(request):
    """
    Endpoint que lista los métodos disponibles del cliente organizados por tipo.
    - Requiere cliente_id, divisa_origen y divisa_destino.
    - Devuelve { operacion_casa, metodos_organizados }.
    """
    serializer = MetodosClienteSerializer(data=request.query_params)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            operacion_casa, metodos_organizados = listar_metodos_cliente_por_divisas(
                data["cliente_id"],
                data["divisa_origen"],
                data["divisa_destino"],
                data.get("es_operacion_real", False)
            )

            return Response(
                {
                    "operacion_casa": operacion_casa,
                    "metodos": metodos_organizados,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def crear_transaccion_operacion(request):
    """
    Endpoint para crear una transacción desde una simulación de operación.
    - Requiere datos de simulación + tauser_id.
    - Crea la transacción en estado pendiente.
    """
    serializer = TransaccionOperacionSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data
            
            # Crear la transacción
            transaccion = crear_transaccion_desde_simulacion(
                operador_id=request.user.id,
                cliente_id=data["cliente_id"],
                divisa_origen_id=data["divisa_origen"],
                divisa_destino_id=data["divisa_destino"],
                monto=data["monto"],
                detalle_metodo_id=data.get("detalle_metodo_id"),
                metodo_id=data.get("metodo_id"),
                tauser_id=data["tauser_id"]
            )
            
            # Serializar la respuesta
            transaccion_serializer = TransaccionSerializer(transaccion)
            return Response(transaccion_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.select_related(
        'operador', 'cliente', 'divisa_origen', 'divisa_destino', 
        'metodo_financiero', 'tauser'
    ).all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cliente__nombre', 'operador__username']
    filterset_fields = ['operacion', 'estado', 'divisa_origen', 'divisa_destino', 'operador', 'cliente']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'monto_origen', 'monto_destino', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransaccionCreateSerializer
        return TransaccionSerializer
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite eliminar transacciones'}, 
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    
    @action(detail=True, methods=['patch'])
    def completar(self, request, pk=None):
        """Marcar transacción como completada"""
        transaccion = self.get_object()
        if transaccion.estado != 'pendiente' and transaccion.estado != 'en_proceso':
            return Response(
                {'error': 'Solo se pueden completar transacciones pendientes o en proceso'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaccion.estado = 'completada'
        transaccion.fecha_fin = timezone.now()
        transaccion.save()
        
        serializer = self.get_serializer(transaccion)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancelar(self, request, pk=None):
        """Cancelar transacción"""
        transaccion = self.get_object()
        if transaccion.estado == 'completada':
            return Response(
                {'error': 'No se puede cancelar una transacción completada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaccion.estado = 'cancelada'
        transaccion.fecha_fin = timezone.now()
        transaccion.save()
        
        serializer = self.get_serializer(transaccion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de transacciones"""
        queryset = self.get_queryset()
        
        total = queryset.count()
        pendientes = queryset.filter(estado='pendiente').count()
        completadas = queryset.filter(estado='completada').count()
        canceladas = queryset.filter(estado='cancelada').count()
        
        # Montos por divisa
        from django.db.models import Sum
        montos_por_divisa = {}
        for transaccion in queryset.filter(estado='completada'):
            divisa = transaccion.divisa_origen.codigo
            if divisa not in montos_por_divisa:
                montos_por_divisa[divisa] = 0.0
            montos_por_divisa[divisa] += float(transaccion.monto_origen)
        
        return Response({
            'total': total,
            'pendientes': pendientes,
            'completadas': completadas,
            'canceladas': canceladas,
            'montos_por_divisa': montos_por_divisa
        })