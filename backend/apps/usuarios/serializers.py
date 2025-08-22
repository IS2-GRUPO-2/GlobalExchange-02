from rest_framework import serializers
from apps.clientes.serializers import ClienteSerializer
from .models import User
from apps.clientes.models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ["idCliente", "nombre", "categoria"]

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    clientes = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Cliente.objects.all(),
        required=False
    )
    class Meta:
        model = User
        fields = ["id", "username", "password", "last_login", "is_staff", "first_name", "last_name", "email", "is_active", "date_joined", "clientes"]
        

    def create(self, validated_data):
        clientes = validated_data.pop("clientes", [])
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        user.clientes.set(clientes)
        return user
