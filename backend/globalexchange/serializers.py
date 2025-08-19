from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token

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
    
    