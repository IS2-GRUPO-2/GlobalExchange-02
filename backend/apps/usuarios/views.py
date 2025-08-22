from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Usuario
from .serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
            if self.action == "create":
                return [permissions.AllowAny()]
            return [permissions.IsAuthenticated()]