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
    permission_classes = [permissions.AllowAny] 
    
    def get_permissions(self):
        """
        Define los permisos necesarios según la acción.
        
        Returns:
            list: Lista de clases de permisos aplicables.
        """
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.AllowAny()]
    
    @action(detail=True, methods=["post"], url_path="asignar_clientes")
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
        clientes = usuario.clientes.all()
        serializer = ClienteSerializer(clientes, many=True)
        return Response(serializer.data)
