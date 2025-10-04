"""
Módulo de vistas para la gestión de usuarios.

Define las vistas basadas en ViewSet para manejar las operaciones CRUD
de usuarios y sus relaciones con clientes a través de la API REST.
"""

from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from apps.clientes.models import Cliente
from apps.clientes.serializers import ClienteSerializer
from django.contrib.auth.models import Group
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de usuarios.
    
    Proporciona endpoints estándar para crear, leer, actualizar y eliminar usuarios,
    además de endpoints personalizados para gestionar las relaciones con clientes.
    
    Endpoints personalizados:
        - asignar_clientes: Asigna clientes específicos a un usuario.
        - get_clientes_asignados: Obtiene la lista de clientes asignados a un usuario.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    
    def get_permissions(self):
        """
        Define los permisos necesarios según la acción.
        
        Returns:
            list: Lista de clases de permisos aplicables.
        """
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        # Esto se llama en update() y partial_update()
        instance = serializer.save()
        password = self.request.data.get("password")
        if password:
            instance.set_password(password)
            instance.save()

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(
            {"message": f"Usuario {user.username} desactivado (eliminado lógico)."},
            status=status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=["post"], url_path="asignar_clientes", permission_classes=[IsAuthenticated])
    def asignar_clientes(self, request, pk=None):
        """
        Asigna clientes al usuario sin necesidad de actualizar todo el objeto.
        
        Args:
            request: Objeto de petición HTTP con lista de IDs de clientes.
            pk: ID del usuario al que se asignarán los clientes.
            
        Returns:
            Response: Confirmación de la asignación o error.
            
        Formato esperado del body:
            {"clientes": [1, 2, 3]}
        """
        user = self.get_object()
        if not request.user.has_perm("usuarios.can_assign_clients"):
            return Response(
                {"detail": "No tienes permiso para asignar clientes."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        clientes_ids = request.data.get("clientes", [])

        if not isinstance(clientes_ids, list):
            return Response(
                {"error": "El campo 'clientes' debe ser una lista de IDs"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clientes = Cliente.objects.filter(idCliente__in=clientes_ids)
        user.clientes.set(clientes)  # reemplaza la relación actual con estos clientes
        user.save()

        return Response(
            {
                "message": "Clientes asignados correctamente",
                "user_id": user.id,
                "clientes": [c.idCliente for c in clientes],
            },
            status=status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=['get'], url_path="get_clientes_asignados")
    def get_clientes(self, request, pk=None):
        """
        Obtiene la lista de clientes asignados a un usuario específico.
        
        Args:
            request: Objeto de petición HTTP.
            pk: ID del usuario del que se quieren obtener los clientes.
            
        Returns:
            Response: Lista de clientes asignados al usuario.
        """
        usuario = self.get_object()
        clientes = usuario.clientes.filter(isActive=True)
        serializer = ClienteSerializer(clientes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="asignar_roles", permission_classes=[IsAuthenticated])
    def asignar_roles(self, request, pk=None):
        """
        Reemplaza los roles (grupos) del usuario con la lista enviada.
        Body: { "roles": [1, 2, 5] }  # IDs de Group
        """
        user = self.get_object()
        if not request.user.has_perm("usuarios.can_assign_roles"):
            return Response(
                {"detail": "No tienes permiso para asignar roles."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        role_ids = request.data.get("roles", [])

        if not isinstance(role_ids, list):
            return Response(
                {"error": "El campo 'roles' debe ser una lista de IDs"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        groups = Group.objects.filter(id__in=role_ids)
        user.groups.set(groups)
        user.save()

        return Response(
            {
                "message": "Roles asignados correctamente",
                "user_id": user.id,
                "roles": list(groups.values_list("id", flat=True)),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="roles")
    def get_roles(self, request, pk=None):
        """
        Retorna los roles actuales del usuario con id y nombre.
        """
        user = self.get_object()
        data = list(user.groups.values("id", "name"))
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="set_cliente_actual")
    def set_cliente_actual(self, request, pk=None):
        """
        Establece el cliente actual del usuario.
        Body esperado: { "cliente_id": 123 }
        """
        user = self.get_object()
        cliente_id = request.data.get("cliente_id")

        if not cliente_id:
            return Response(
                {"error": "Debe enviar 'cliente_id'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cliente = user.clientes.get(pk=cliente_id, isActive=True)
        except Cliente.DoesNotExist:
            return Response(
                {"error": "El cliente no está asignado al usuario o está inactivo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.cliente_actual = cliente
        user.save()

        return Response(
            {
                "message": f"Cliente actual actualizado a {cliente.nombre}",
                "cliente_id": cliente.idCliente,
            },
            status=status.HTTP_200_OK,
        )


    @action(detail=True, methods=["get"], url_path="cliente_actual")
    def get_cliente_actual(self, request, pk=None):
        """
        Devuelve el cliente actual del usuario.
        - Si el actual es inválido (None, inactivo o no asignado), intenta
        seleccionar automáticamente otro cliente ASIGNADO y ACTIVO,
        lo persiste en DB y lo retorna.
        - Solo retorna {"cliente_actual": None} si el usuario no tiene clientes asignados.
        """
        user = self.get_object()

        activos_qs = user.clientes.filter(isActive=True)

        if not user.clientes.exists():
            return Response({"cliente_actual": None}, status=status.HTTP_200_OK)

        actual = user.cliente_actual
        if actual and actual.isActive and activos_qs.filter(pk=actual.pk).exists():
            return Response({"cliente_actual": ClienteSerializer(actual).data},
                            status=status.HTTP_200_OK)

        alternativo = activos_qs.order_by("nombre").first()
        if alternativo:
            user.cliente_actual = alternativo
            user.save()
            return Response({"cliente_actual": ClienteSerializer(alternativo).data},
                            status=status.HTTP_200_OK)

        return Response({"cliente_actual": None}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def me_permissions(request):
    """
    Devuelve los permisos *actuales* del usuario logueado
    como codenames nativos: ["auth.view_group", "clientes.add_cliente", ...]
    """
    perms = sorted(list(request.user.get_all_permissions()))
    return Response({"perms": perms})
