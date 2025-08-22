from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
            if self.action == "create":
                return [permissions.AllowAny()]
            return [permissions.IsAuthenticated()]