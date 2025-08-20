from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token
from rest_framework import serializers
from django.contrib.auth.models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user) -> Token:
        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['roles'] = list(user.groups.values_list('name', flat=True))
        token['permissions'] = list(user.user_permissions.values_list('codename', flat=True))
        token['is_active'] = user.is_active
        token['date_joined'] = user.date_joined

        return token
    
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["id", "username", "password", "last_login", "is_staff", "first_name", "last_name", "email", "is_active", "date_joined"]
        

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user