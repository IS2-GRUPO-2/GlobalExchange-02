"""
Vistas de Autenticación y MFA

Este módulo contiene todas las vistas relacionadas con:
- Registro y verificación de email
- Autenticación de dos factores (MFA/2FA)
- Login con soporte para MFA

Autor: Elias Figueredo
Fecha: 08-10-2025
"""

from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp import match_token
from django.contrib.auth import get_user_model
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64
import jwt
from django.conf import settings
from datetime import datetime, timedelta
from .serializers import (
    RegisterSerializer, 
    VerifyEmailSerializer,
    MFASetupSerializer,
    MFAEnableSerializer,
    MFADisableSerializer,
    MFAVerifySerializer,
    CustomLoginSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class VerifyEmailView(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Cuenta verificada con éxito"}, status=status.HTTP_200_OK)


# ============================================
# MFA (Multi-Factor Authentication) Views
# ============================================

class MFAStatusView(APIView):
    """
    Vista para obtener el estado de MFA del usuario
    
    **Endpoint:** GET /api/auth/mfa/status/
    
    **Permisos:** IsAuthenticated
    
    **Descripción:**
    Retorna información sobre si el usuario tiene MFA habilitado y si tiene
    un dispositivo TOTP confirmado.
    
    **Response:**
    ```json
    {
        "mfa_enabled": true,
        "has_device": true
    }
    ```
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "mfa_enabled": user.mfa_enabled,
            "has_device": TOTPDevice.objects.filter(user=user, confirmed=True).exists()
        })


class MFASetupView(APIView):
    """
    Vista para iniciar la configuración de MFA
    
    **Endpoint:** POST /api/auth/mfa/setup/
    
    **Permisos:** IsAuthenticated
    
    **Descripción:**
    Genera un nuevo dispositivo TOTP (Time-based One-Time Password) y retorna:
    - Un código QR para escanear con apps como Google Authenticator
    - La clave secreta para configuración manual
    - El ID del dispositivo creado
    
    El dispositivo se crea en estado "no confirmado" y debe ser verificado
    con un código TOTP válido usando el endpoint /mfa/enable/
    
    **Response:**
    ```json
    {
        "secret": "JBSWY3DPEHPK3PXP",
        "qr_code": "data:image/png;base64,iVBORw0KG...",
        "device_id": 1
    }
    ```
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MFASetupSerializer

    def post(self, request):
        user = request.user
        
        # Eliminar dispositivos no confirmados anteriores
        TOTPDevice.objects.filter(user=user, confirmed=False).delete()
        
        # Crear nuevo dispositivo TOTP (no confirmado aún)
        device = TOTPDevice.objects.create(
            user=user,
            name='default',
            confirmed=False
        )
        
        # Generar URL para el QR code
        # Formato: otpauth://totp/GlobalExchange:username?secret=XXX&issuer=GlobalExchange
        url = device.config_url
        
        # Generar QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            "secret": device.key,
            "qr_code": f"data:image/png;base64,{img_str}",
            "device_id": device.id
        })


class MFAEnableView(APIView):
    """
    Vista para habilitar MFA verificando el código TOTP
    
    **Endpoint:** POST /api/auth/mfa/enable/
    
    **Permisos:** IsAuthenticated
    
    **Descripción:**
    Verifica un código TOTP de 6 dígitos y, si es válido:
    - Confirma el dispositivo TOTP
    - Habilita MFA en la cuenta del usuario
    
    Debe llamarse después de /mfa/setup/ para completar la configuración.
    
    **Request Body:**
    ```json
    {
        "token": "123456"
    }
    ```
    
    **Response Success:**
    ```json
    {
        "message": "MFA habilitado exitosamente",
        "mfa_enabled": true
    }
    ```
    
    **Response Error:**
    ```json
    {
        "error": "Código inválido. Por favor, intenta nuevamente."
    }
    ```
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MFAEnableSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        token = serializer.validated_data['token']
        
        # Buscar dispositivo no confirmado
        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        
        if not device:
            return Response(
                {"error": "No se encontró dispositivo. Por favor, ejecuta el setup primero."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar el código TOTP
        if device.verify_token(token):
            # Confirmar el dispositivo
            device.confirmed = True
            device.save()
            
            # Habilitar MFA en el usuario
            user.mfa_enabled = True
            user.save()
            
            return Response({
                "message": "MFA habilitado exitosamente",
                "mfa_enabled": True
            })
        else:
            return Response(
                {"error": "Código inválido. Por favor, intenta nuevamente."},
                status=status.HTTP_400_BAD_REQUEST
            )


class MFADisableView(APIView):
    """
    Vista para deshabilitar MFA verificando el código TOTP
    
    **Endpoint:** POST /api/auth/mfa/disable/
    
    **Permisos:** IsAuthenticated
    
    **Descripción:**
    Verifica un código TOTP de 6 dígitos y, si es válido:
    - Elimina todos los dispositivos TOTP del usuario
    - Deshabilita MFA en la cuenta del usuario
    
    Solo puede ser llamado si el usuario tiene MFA habilitado.
    
    **Request Body:**
    ```json
    {
        "token": "123456"
    }
    ```
    
    **Response Success:**
    ```json
    {
        "message": "MFA deshabilitado exitosamente",
        "mfa_enabled": false
    }
    ```
    
    **Response Error:**
    ```json
    {
        "error": "Código inválido. Por favor, intenta nuevamente."
    }
    ```
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MFADisableSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        token = serializer.validated_data['token']
        
        if not user.mfa_enabled:
            return Response(
                {"error": "MFA no está habilitado para este usuario."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar dispositivo confirmado
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        
        if not device:
            return Response(
                {"error": "No se encontró dispositivo MFA."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar el código TOTP
        if device.verify_token(token):
            # Eliminar todos los dispositivos del usuario
            TOTPDevice.objects.filter(user=user).delete()
            
            # Deshabilitar MFA en el usuario
            user.mfa_enabled = False
            user.save()
            
            return Response({
                "message": "MFA deshabilitado exitosamente",
                "mfa_enabled": False
            })
        else:
            return Response(
                {"error": "Código inválido. Por favor, intenta nuevamente."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================
# Custom Login with MFA Support
# ============================================

class CustomLoginView(APIView):
    """
    Vista de login con soporte para autenticación de dos factores
    
    **Endpoint:** POST /api/auth/login/
    
    **Permisos:** AllowAny
    
    **Descripción:**
    Login con flujo de 2 pasos que soporta MFA:
    
    **Caso 1 - Usuario sin MFA:**
    - Valida credenciales (username/password)
    - Retorna JWT access y refresh tokens inmediatamente
    
    **Caso 2 - Usuario con MFA:**
    - Valida credenciales (username/password)
    - Genera un token temporal (válido 5 minutos)
    - Requiere verificación TOTP en /mfa/verify-login/
    
    **Request Body:**
    ```json
    {
        "username": "usuario",
        "password": "contraseña"
    }
    ```
    
    **Response Sin MFA:**
    ```json
    {
        "access": "eyJ0eXAiOiJKV1QiLCJ...",
        "refresh": "eyJ0eXAiOiJKV1QiLC...",
        "mfa_required": false
    }
    ```
    
    **Response Con MFA:**
    ```json
    {
        "mfa_required": true,
        "temp_token": "eyJ0eXAiOiJKV1Qi...",
        "message": "Por favor, ingresa tu código de autenticación"
    }
    ```
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    serializer_class = CustomLoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        # Autenticar usuario con username/password
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {"error": "Usuario inactivo"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar si el usuario tiene MFA habilitado
        if user.mfa_enabled:
            # Generar token temporal (válido por 5 minutos)
            temp_token_payload = {
                'user_id': user.id,
                'username': user.username,
                'type': 'mfa_temp',
                'exp': datetime.utcnow() + timedelta(minutes=5)
            }
            temp_token = jwt.encode(
                temp_token_payload,
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            
            return Response({
                "mfa_required": True,
                "temp_token": temp_token,
                "message": "Por favor, ingresa tu código de autenticación"
            })
        else:
            # Usuario sin MFA - emitir JWT normal
            refresh = RefreshToken.for_user(user)
            
            # Agregar claims personalizados (igual que CustomTokenObtainPairSerializer)
            refresh['username'] = user.username
            refresh['email'] = user.email
            refresh['roles'] = list(user.groups.values_list('name', flat=True))
            refresh['permissions'] = list(user.user_permissions.values_list('codename', flat=True))
            refresh['is_active'] = user.is_active
            refresh['date_joined'] = user.date_joined.isoformat()
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "mfa_required": False
            })


class MFAVerifyLoginView(APIView):
    """
    Vista para verificar código MFA durante el login
    
    **Endpoint:** POST /api/auth/mfa/verify-login/
    
    **Permisos:** AllowAny
    
    **Descripción:**
    Segundo paso del login para usuarios con MFA habilitado.
    - Valida el token temporal recibido en el login
    - Verifica el código TOTP de 6 dígitos
    - Emite JWT access y refresh tokens si todo es válido
    
    **Request Body:**
    ```json
    {
        "temp_token": "eyJ0eXAiOiJKV1Qi...",
        "token": "123456"
    }
    ```
    
    **Response Success:**
    ```json
    {
        "access": "eyJ0eXAiOiJKV1QiLCJ...",
        "refresh": "eyJ0eXAiOiJKV1QiLC..."
    }
    ```
    
    **Response Error:**
    ```json
    {
        "error": "Código inválido"
    }
    ```
    
    **Notas:**
    - El token temporal expira en 5 minutos
    - El código TOTP debe ser generado por la app de autenticación del usuario
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    serializer_class = MFAVerifySerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        temp_token = serializer.validated_data['temp_token']
        totp_token = serializer.validated_data['token']
        
        # Decodificar token temporal
        try:
            payload = jwt.decode(
                temp_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return Response(
                {"error": "Token temporal expirado. Por favor, inicia sesión nuevamente."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return Response(
                {"error": "Token temporal inválido"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar que sea un token temporal de MFA
        if payload.get('type') != 'mfa_temp':
            return Response(
                {"error": "Token inválido"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Obtener usuario
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar código TOTP
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        
        if not device:
            return Response(
                {"error": "No se encontró dispositivo MFA confirmado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not device.verify_token(totp_token):
            return Response(
                {"error": "Código TOTP inválido"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Código TOTP válido - emitir JWT real
        refresh = RefreshToken.for_user(user)
        
        # Agregar claims personalizados
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['roles'] = list(user.groups.values_list('name', flat=True))
        refresh['permissions'] = list(user.user_permissions.values_list('codename', flat=True))
        refresh['is_active'] = user.is_active
        refresh['date_joined'] = user.date_joined.isoformat()
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "message": "Autenticación exitosa"
        })
