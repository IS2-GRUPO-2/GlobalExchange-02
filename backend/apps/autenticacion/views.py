from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import RegisterSerializer, VerifyEmailSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class VerifyEmailView(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Cuenta verificada con éxito"}, status=status.HTTP_200_OK)
