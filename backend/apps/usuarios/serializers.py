from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['idUsuario', 'username', 'email', 'telefono', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined']


