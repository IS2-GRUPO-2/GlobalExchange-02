"""
Módulo de serializers para la gestión de usuarios.

Define los serializers necesarios para la conversión entre objetos User
y representaciones JSON en la API REST.
"""

from rest_framework import serializers
from apps.clientes.serializers import ClienteSerializer
from .models import User
from apps.clientes.models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Cliente dentro del contexto de usuarios.
    
    Incluye solo los campos básicos necesarios para la relación con usuarios.
    """
    class Meta:
        model = Cliente
        fields = ["idCliente", "nombre", "categoria"]

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
    class Meta:
        model = User
        fields = ["id", "username", "password", "last_login", "is_staff", "first_name", "last_name", "email", "is_active", "date_joined", "clientes"]
        

    def create(self, validated_data):
        """
        Crea un nuevo usuario con contraseña encriptada y clientes asignados.
        
        Args:
            validated_data (dict): Datos validados del usuario.
            
        Returns:
            User: Instancia del usuario creado.
        """
        clientes = validated_data.pop("clientes", [])
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        user.clientes.set(clientes)
        return user
