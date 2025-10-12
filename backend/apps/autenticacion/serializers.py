"""
Serializers para Autenticación y MFA

Este módulo contiene los serializers para:
- Configuración de MFA (setup, enable, disable)
- Verificación de MFA durante login
- Registro y verificación de email

Autor: Elias Figueredo
Fecha: 08-10-2025
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmailVerificationCode
import random
from apps.notificaciones.notification_service import NotificationService

User = get_user_model()
notification_service = NotificationService()


class MFASetupSerializer(serializers.Serializer):
    """
    Serializer para iniciar la configuración de MFA
    
    No requiere campos de entrada. Se usa solo para validación del endpoint.
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    pass


class MFAEnableSerializer(serializers.Serializer):
    """
    Serializer para habilitar MFA con verificación de código TOTP
    
    **Campos:**
    - token: Código TOTP de 6 dígitos generado por la app de autenticación
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    token = serializers.CharField(
        max_length=6,
        min_length=6,
        help_text="Código TOTP de 6 dígitos"
    )


class MFADisableSerializer(serializers.Serializer):
    """
    Serializer para deshabilitar MFA con verificación de código TOTP
    
    **Campos:**
    - token: Código TOTP de 6 dígitos generado por la app de autenticación
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    token = serializers.CharField(
        max_length=6,
        min_length=6,
        help_text="Código TOTP de 6 dígitos"
    )


class MFAVerifySerializer(serializers.Serializer):
    """
    Serializer para verificar código TOTP durante el proceso de login
    
    **Campos:**
    - temp_token: Token temporal JWT recibido en el primer paso del login
    - token: Código TOTP de 6 dígitos generado por la app de autenticación
    
    **Uso:**
    Se utiliza en el segundo paso del login cuando el usuario tiene MFA habilitado.
    El temp_token expira en 5 minutos.
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    temp_token = serializers.CharField(help_text="Token temporal recibido en el login")
    token = serializers.CharField(
        max_length=6,
        min_length=6,
        help_text="Código TOTP de 6 dígitos"
    )


class CustomLoginSerializer(serializers.Serializer):
    """
    Serializer para login con soporte de autenticación de dos factores
    
    **Campos:**
    - username: Nombre de usuario
    - password: Contraseña (write_only, no se retorna en respuestas)
    
    **Comportamiento:**
    - Si el usuario NO tiene MFA: retorna JWT inmediatamente
    - Si el usuario SÍ tiene MFA: retorna temp_token para verificación
    
    **Autor:** Elias Figueredo
    **Fecha:** 08-10-2025
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    app_id = serializers.CharField(required=False, allow_blank=True)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            password=validated_data["password"],
            email_verified=False
        )
        # generar código
        code = f"{random.randint(0, 999999):06d}"
        EmailVerificationCode.objects.create(user=user, code=code)
        # enviar email
        notification_service.send_notification(
            channel="email",
            subject="Código de verificación",
            template_name="emails/verification_code.html",
            context={"code": code, "user": user},
            recipient_list=[user.email],
        )

        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email, code = attrs.get("email"), attrs.get("code")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")

        try:
            verification = EmailVerificationCode.objects.filter(user=user, code=code).latest("created_at")
        except EmailVerificationCode.DoesNotExist:
            raise serializers.ValidationError("Código inválido")

        if verification.is_expired():
            raise serializers.ValidationError("El código ha expirado")

        user.email_verified = True
        user.save()
        return attrs
