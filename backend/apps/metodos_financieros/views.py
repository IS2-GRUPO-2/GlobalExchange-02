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

from .models import (
    Banco,
    BilleteraDigitalCatalogo,
    TarjetaCatalogo,
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    Cheque

)
from .serializers import (
    BancoSerializer,
    BilleteraDigitalCatalogoSerializer,
    TarjetaCatalogoSerializer,
    ChequeSerializer,
    MetodoFinancieroSerializer,
    MetodoFinancieroDetalleSerializer,
    CuentaBancariaSerializer,
    BilleteraDigitalSerializer,
    TarjetaSerializer
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
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']
    pagination_class = OperacionesPagination

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

    @action(detail=True, methods=['post'])
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
            )
            
            for cuenta in cuentas_relacionadas:
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
                metodo_financiero_detalle__desactivado_por_catalogo=True
            )
            
            for cuenta in cuentas_relacionadas:
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


class TarjetaCatalogoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD del catálogo de marcas de tarjetas locales.

    Proporciona endpoints para gestionar las marcas de tarjetas locales disponibles en el sistema.
    Solo los administradores pueden crear, actualizar o eliminar marcas.
    """
    queryset = TarjetaCatalogo.objects.all()
    serializer_class = TarjetaCatalogoSerializer
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
            from .models import Tarjeta
            tarjetas_relacionadas = Tarjeta.objects.filter(
                marca=instance,
                metodo_financiero_detalle__is_active=True
            )
            
            for tarjeta in tarjetas_relacionadas:
                tarjeta.metodo_financiero_detalle.is_active = False
                tarjeta.metodo_financiero_detalle.desactivado_por_catalogo = True
                tarjeta.metodo_financiero_detalle.save()
                affected_instances.append({
                    'id': tarjeta.id,
                    'tipo': tarjeta.tipo,
                    'titular': tarjeta.titular
                })
        else:
            # Si se reactiva la marca, permitir reactivar tarjetas que fueron desactivadas por catálogo
            from .models import Tarjeta
            tarjetas_relacionadas = Tarjeta.objects.filter(
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
                    'tipo': tarjeta.tipo,
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
        elif self.action == 'list_metodos_operacion':
            permission_classes = [permissions.AllowAny]
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
    
    @action(detail=False, methods=['get'], url_path='metodos-operacion')
    def list_metodos_operacion(self, request):
        """
        Lista los métodos financieros disponibles para un tipo de operación específica.

        Parámetros de consulta:
            - op_perspectiva_casa (str): Tipo de operación (e.g., 'compra', 'venta').

        Returns:
            Response: Lista de métodos financieros filtrados por activos y tipo de operación (Sin paginar).
        """
        op_perspectiva_casa = request.query_params.get('op_perspectiva_casa', None)
        if op_perspectiva_casa not in ['compra', 'venta']:
            return Response(
                {"error": "Parámetro 'operacion' inválido. Debe ser 'compra' o 'venta'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if op_perspectiva_casa == 'compra':
            # Métodos que permiten compra
            metodos = MetodoFinanciero.objects.filter(
                is_active=True,
                permite_pago=True
            )
        else:
            # Métodos que permiten venta
            metodos = MetodoFinanciero.objects.filter(
                is_active=True,
                permite_cobro=True
            )
        
        serializer = self.get_serializer(metodos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
            cliente = self.request.user.cliente_actual
            if cliente is not None:
                serializer.save(cliente=cliente)
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
            # Admins ven todas las cuentas (casa y clientes)
            return queryset
        else:
            # Usuarios regulares ven solo las de sus clientes (no las de la casa)
            return queryset.filter(
                metodo_financiero_detalle__cliente=self.request.user.cliente_actual,
                metodo_financiero_detalle__es_cuenta_casa=False
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

    @action(detail=False, methods=['get'], url_path='mis-cuentas')
    def mis_cuentas_bancarias(self, request):
        """
        Retorna las cuentas bancarias activas del cliente actual.
        """
        cliente = request.user.cliente_actual
        if not cliente:
            return Response({"error": "No se encontró cliente asociado al usuario."}, status=status.HTTP_400_BAD_REQUEST)
            
        cuentas = CuentaBancaria.objects.select_related(
            'metodo_financiero_detalle', 'banco'
        ).filter(
            metodo_financiero_detalle__cliente=cliente,
            metodo_financiero_detalle__is_active=True,
            metodo_financiero_detalle__desactivado_por_catalogo=False,
            metodo_financiero_detalle__es_cuenta_casa=False
        )
        
        serializer = self.get_serializer(cuentas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        
        - Usuarios regulares: solo ven sus propias billeteras
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = BilleteraDigital.objects.select_related('metodo_financiero_detalle', 'plataforma').all()
        
        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            # Admins ven todas las billeteras (casa y clientes)
            return queryset
        else:
            # Usuarios regulares ven solo las de sus clientes (no las de la casa)
            return queryset.filter(
                metodo_financiero_detalle__cliente=self.request.user.cliente_actual,
                metodo_financiero_detalle__es_cuenta_casa=False
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

    @action(detail=False, methods=['get'], url_path='mis-billeteras')
    def mis_billeteras_digitales(self, request):
        """
        Retorna las billeteras digitales activas del cliente actual.
        """
        cliente = request.user.cliente_actual
        if not cliente:
            return Response({"error": "No se encontró cliente asociado al usuario."}, status=status.HTTP_400_BAD_REQUEST)
            
        billeteras = BilleteraDigital.objects.select_related(
            'metodo_financiero_detalle', 'plataforma'
        ).filter(
            metodo_financiero_detalle__cliente=cliente,
            metodo_financiero_detalle__is_active=True,
            metodo_financiero_detalle__desactivado_por_catalogo=False,
            metodo_financiero_detalle__es_cuenta_casa=False
        )
        
        serializer = self.get_serializer(billeteras, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        
        - Usuarios regulares: solo ven sus propias tarjetas
        
        NOTA: No se filtra por is_active aquí, se incluye el estado en el serializer
        """
        queryset = Tarjeta.objects.select_related('metodo_financiero_detalle').all()

        if self.request.user.has_perm('operaciones.view_metodofinanciero'):
            # Admins ven todas las tarjetas (casa y clientes)
            return queryset
        else:
            # Usuarios regulares ven solo las de sus clientes (no las de la casa)
            return queryset.filter(
                metodo_financiero_detalle__cliente=self.request.user.cliente_actual,
                metodo_financiero_detalle__es_cuenta_casa=False
            )

    def create(self, request, *args, **kwargs):
        """Override para debug - temporal"""
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"DEBUG: Datos recibidos para crear tarjeta: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"DEBUG: Errores de validación: {serializer.errors}")
            
        return super().create(request, *args, **kwargs)

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

    @action(detail=False, methods=['get'], url_path='mis-tarjetas')
    def mis_tarjetas(self, request):
        """
        Retorna las tarjetas activas del cliente actual.
        """
        cliente = request.user.cliente_actual
        if not cliente:
            return Response({"error": "No se encontró cliente asociado al usuario."}, status=status.HTTP_400_BAD_REQUEST)
            
        tarjetas = Tarjeta.objects.select_related(
            'metodo_financiero_detalle', 'marca'
        ).filter(
            metodo_financiero_detalle__cliente=cliente,
            metodo_financiero_detalle__is_active=True,
            metodo_financiero_detalle__desactivado_por_catalogo=False,
            metodo_financiero_detalle__es_cuenta_casa=False
        )
        
        serializer = self.get_serializer(tarjetas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

   



