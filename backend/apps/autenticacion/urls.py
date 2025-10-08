"""
URLs de Autenticación y MFA

Este módulo define todos los endpoints relacionados con:
- Autenticación (login, registro, verificación de email)
- Gestión de MFA (status, setup, enable, disable)
- Verificación MFA durante login

Autor: Elias Figueredo
Fecha: 08-10-2025
"""

from django.urls import path
from .views import (
    RegisterView, 
    VerifyEmailView,
    MFAStatusView,
    MFASetupView,
    MFAEnableView,
    MFADisableView,
    CustomLoginView,
    MFAVerifyLoginView
)

urlpatterns = [
    # ============================================
    # Authentication Endpoints
    # ============================================
    path("login/", CustomLoginView.as_view(), name="custom-login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("register/", RegisterView.as_view(), name="register"),
    
    # ============================================
    # MFA Management Endpoints
    # ============================================
    # GET - Obtener estado de MFA del usuario
    path("mfa/status/", MFAStatusView.as_view(), name="mfa-status"),
    
    # POST - Iniciar configuración de MFA (genera QR)
    path("mfa/setup/", MFASetupView.as_view(), name="mfa-setup"),
    
    # POST - Habilitar MFA (verifica código y activa)
    path("mfa/enable/", MFAEnableView.as_view(), name="mfa-enable"),
    
    # POST - Deshabilitar MFA (verifica código y desactiva)
    path("mfa/disable/", MFADisableView.as_view(), name="mfa-disable"),
    
    # ============================================
    # MFA Login Verification
    # ============================================
    # POST - Verificar código MFA durante login
    path("mfa/verify-login/", MFAVerifyLoginView.as_view(), name="mfa-verify-login"),
]
