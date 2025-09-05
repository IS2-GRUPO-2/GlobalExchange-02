from rest_framework import serializers
from .models import Cliente, CategoriaCliente
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class UserSimpleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ["id", "username", "email"]

class ClienteSerializer(serializers.ModelSerializer):
    nombreCategoria= serializers.CharField(source='categoria.nombre', read_only=True)
    class Meta:
        model = Cliente
        fields = "__all__"
        
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
