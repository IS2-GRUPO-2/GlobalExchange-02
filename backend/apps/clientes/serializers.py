from rest_framework import serializers
from .models import Cliente
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class UserSimpleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ["id", "username", "email"]

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"
