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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] 
    
    def get_permissions(self):
            if self.action == "create":
                return [permissions.AllowAny()]
            return [permissions.AllowAny()]
    
    @action(detail=True, methods=["post"], url_path="asignar_clientes")
    def asignar_clientes(self, request, pk=None):
        """
        Asigna clientes al usuario sin necesidad de actualizar todo el objeto.
        Espera una lista de IDs de clientes en el body.
        """
        user = self.get_object()
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
        """Este endpoint retorna una lista de todos los usuarios que pueden operar en nombre de este cliente."""
        usuario = self.get_object()
        clientes = usuario.clientes.all()
        serializer = ClienteSerializer(clientes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="asignar_roles")
    def asignar_roles(self, request, pk=None):
        """
        Reemplaza los roles (grupos) del usuario con la lista enviada.
        Body: { "roles": [1, 2, 5] }  # IDs de Group
        """
        user = self.get_object()
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_permissions(request):
    """
    Devuelve los permisos *actuales* del usuario logueado
    como codenames nativos: ["auth.view_group", "clientes.add_cliente", ...]
    """
    perms = sorted(list(request.user.get_all_permissions()))
    return Response({"perms": perms})
