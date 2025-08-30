from rest_framework import serializers
from apps.clientes.serializers import ClienteSerializer
from .models import User
from apps.clientes.models import Cliente
from django.contrib.auth.models import Group

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
    roles = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), source="groups", required=False
    )

    class Meta:
        model = User
        fields = ["id", "username", "password", "last_login", "is_staff",
                  "first_name", "last_name", "email", "is_active", "date_joined", "clientes", "roles"]

    def create(self, validated_data):
        clientes = validated_data.pop("clientes", [])
        roles = validated_data.pop("groups", [])
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        user.clientes.set(clientes)
        if roles:
            user.groups.set(roles)
        return user
