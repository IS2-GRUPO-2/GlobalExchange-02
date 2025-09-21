from rest_framework import serializers
from .models import Cliente, CategoriaCliente
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class UserSimpleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ["id", "username", "email"]

        
class CategoriaClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo CategoriaCliente.
    
    Maneja la serialización y deserialización de categorías de clientes,
    proporcionando una interfaz completa para la gestión de categorías.
    
    Características:
        - Incluye todos los campos del modelo CategoriaCliente
        - Permite operaciones CRUD completas sobre categorías
        - Validación automática según las reglas del modelo
    """
    class Meta:
        model = CategoriaCliente
        fields = "__all__"
class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Cliente.
    
    Maneja la serialización y deserialización de clientes, incluyendo
    información extendida de la categoría asociada.
    
    Campos:
        nombreCategoria: Campo calculado de solo lectura que obtiene
                        el nombre de la categoría asociada al cliente.
                        
    Características:
        - Incluye todos los campos del modelo Cliente
        - Agrega información de la categoría sin necesidad de consultas adicionales
        - Campo nombreCategoria es de solo lectura para evitar inconsistencias
    """
    categoria= CategoriaClienteSerializer(source='idCategoria', read_only=True)
    class Meta:
        model = Cliente
        fields = "__all__"

class ClientePaginatedResponseSerializer(serializers.Serializer):
    count    = serializers.IntegerField()
    next     = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results  = ClienteSerializer(many=True)