"""
Módulo de serializers para la gestión de usuarios.

Define los serializers necesarios para la operación entre objetos User
y representaciones JSON en la API REST.
"""

from rest_framework import serializers
from apps.clientes.serializers import ClienteSerializer
from .models import User
from apps.clientes.models import Cliente
from django.contrib.auth.models import Group

class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Cliente dentro del contexto de usuarios.
    
    Incluye solo los campos básicos necesarios para la relación con usuarios.
    """
    class Meta:
        model = Cliente
        fields = ["id", "nombre", "categoria"]

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo User.
    
    Maneja la serialización y deserialización de usuarios, incluyendo
    la relación con clientes y el manejo seguro de contraseñas.
    
    Campos:
        password: Campo de solo escritura para la contraseña del usuario.
        clientes: Relación Many-to-Many con clientes, opcional.
    """
    password = serializers.CharField(write_only=True)
    clientes = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Cliente.objects.all(),
        required=False
    )
    roles = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), source="groups", required=False
    )

    class Meta:
        model = User
        fields = ["id", "username", "password", "last_login",
                  "first_name", "last_name", "email", "is_active", "date_joined", "clientes", "roles", "mfa_enabled"]
        read_only_fields = ["mfa_enabled"]  # Solo se modifica mediante endpoints MFA

    def create(self, validated_data):
        """
        Crea un nuevo usuario con contraseña encriptada y clientes asignados.
        
        Args:
            validated_data (dict): Datos validados del usuario.
            
        Returns:
            User: Instancia del usuario creado.
        """
        clientes = validated_data.pop("clientes", [])
        roles = validated_data.pop("groups", [])
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        user.clientes.set(clientes)
        if roles:
            user.groups.set(roles)
        return user
