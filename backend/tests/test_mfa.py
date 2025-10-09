"""
Tests unitarios para la funcionalidad de MFA (Multi-Factor Authentication)
"""
import pytest
import jwt
import time
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework import status
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.oath import totp

from apps.usuarios.models import User

pytestmark = pytest.mark.django_db


# ============================================
# Helper Functions
# ============================================

def get_totp_token(device):
    """Genera un token TOTP válido para un dispositivo"""
    # Usar la función totp de django_otp
    key = device.bin_key
    return str(totp(key)).zfill(6)


# ============================================
# Fixtures
# ============================================

@pytest.fixture
def api_client():
    """Cliente API para pruebas"""
    return APIClient()


@pytest.fixture
def user_without_mfa():
    """Usuario sin MFA habilitado"""
    return User.objects.create_user(
        username='user_no_mfa',
        password='testpass123',
        email='no_mfa@example.com',
        mfa_enabled=False
    )


@pytest.fixture
def user_with_mfa():
    """Usuario con MFA habilitado y dispositivo confirmado"""
    user = User.objects.create_user(
        username='user_mfa',
        password='testpass123',
        email='mfa@example.com',
        mfa_enabled=True
    )
    # Crear dispositivo TOTP confirmado
    device = TOTPDevice.objects.create(
        user=user,
        name='default',
        confirmed=True
    )
    return user


@pytest.fixture
def authenticated_client_no_mfa(api_client, user_without_mfa):
    """Cliente autenticado sin MFA"""
    api_client.force_authenticate(user=user_without_mfa)
    return api_client


@pytest.fixture
def authenticated_client_with_mfa(api_client, user_with_mfa):
    """Cliente autenticado con MFA"""
    api_client.force_authenticate(user=user_with_mfa)
    return api_client


# ============================================
# Tests de MFA Status
# ============================================

class TestMFAStatus:
    """Tests para obtener el estado de MFA"""
    
    def test_status_without_mfa(self, authenticated_client_no_mfa):
        """Usuario sin MFA debe retornar mfa_enabled=False"""
        response = authenticated_client_no_mfa.get('/api/auth/mfa/status/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['mfa_enabled'] is False
        assert response.data['has_device'] is False
    
    def test_status_with_mfa(self, authenticated_client_with_mfa):
        """Usuario con MFA debe retornar mfa_enabled=True"""
        response = authenticated_client_with_mfa.get('/api/auth/mfa/status/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['mfa_enabled'] is True
        assert response.data['has_device'] is True
    
    def test_status_unauthenticated(self, api_client):
        """Usuario no autenticado debe ser rechazado"""
        response = api_client.get('/api/auth/mfa/status/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# Tests de MFA Setup
# ============================================

class TestMFASetup:
    """Tests para configurar MFA"""
    
    def test_setup_generates_qr_and_secret(self, authenticated_client_no_mfa):
        """Setup debe generar QR code y secret"""
        response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'secret' in response.data
        assert 'qr_code' in response.data
        assert 'device_id' in response.data
        assert response.data['qr_code'].startswith('data:image/png;base64,')
    
    def test_setup_creates_unconfirmed_device(self, authenticated_client_no_mfa, user_without_mfa):
        """Setup debe crear un dispositivo no confirmado"""
        response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que se creó un dispositivo no confirmado
        device = TOTPDevice.objects.filter(user=user_without_mfa, confirmed=False).first()
        assert device is not None
        assert device.confirmed is False
    
    def test_setup_removes_old_unconfirmed_devices(self, authenticated_client_no_mfa, user_without_mfa):
        """Setup debe eliminar dispositivos no confirmados anteriores"""
        # Crear un dispositivo no confirmado previo
        old_device = TOTPDevice.objects.create(
            user=user_without_mfa,
            name='old',
            confirmed=False
        )
        
        response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que el dispositivo antiguo fue eliminado
        assert not TOTPDevice.objects.filter(id=old_device.id).exists()
        
        # Verificar que solo existe un dispositivo no confirmado
        devices = TOTPDevice.objects.filter(user=user_without_mfa, confirmed=False)
        assert devices.count() == 1
    
    def test_setup_unauthenticated(self, api_client):
        """Setup debe rechazar usuarios no autenticados"""
        response = api_client.post('/api/auth/mfa/setup/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# Tests de MFA Enable
# ============================================

class TestMFAEnable:
    """Tests para habilitar MFA"""
    
    def test_enable_with_valid_code(self, authenticated_client_no_mfa, user_without_mfa):
        """Habilitar MFA con código válido debe ser exitoso"""
        # Setup primero
        setup_response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        assert setup_response.status_code == status.HTTP_200_OK
        
        # Obtener el dispositivo y generar un código válido
        device = TOTPDevice.objects.filter(user=user_without_mfa, confirmed=False).first()
        valid_token = get_totp_token(device)
        
        # Habilitar MFA
        response = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': valid_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['mfa_enabled'] is True
        assert 'MFA habilitado exitosamente' in response.data['message']
        
        # Verificar que el dispositivo está confirmado
        device.refresh_from_db()
        assert device.confirmed is True
        
        # Verificar que el usuario tiene MFA habilitado
        user_without_mfa.refresh_from_db()
        assert user_without_mfa.mfa_enabled is True
    
    def test_enable_with_invalid_code(self, authenticated_client_no_mfa, user_without_mfa):
        """Habilitar MFA con código inválido debe fallar"""
        # Setup primero
        setup_response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        assert setup_response.status_code == status.HTTP_200_OK
        
        # Intentar habilitar con código inválido
        response = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': '000000'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'inválido' in response.data['error'].lower()
        
        # Verificar que MFA NO fue habilitado
        user_without_mfa.refresh_from_db()
        assert user_without_mfa.mfa_enabled is False
    
    def test_enable_without_setup(self, authenticated_client_no_mfa):
        """Intentar habilitar MFA sin hacer setup primero debe fallar"""
        response = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': '123456'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'setup' in response.data['error'].lower()
    
    def test_enable_unauthenticated(self, api_client):
        """Enable debe rechazar usuarios no autenticados"""
        response = api_client.post('/api/auth/mfa/enable/', {
            'token': '123456'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# Tests de MFA Disable
# ============================================

class TestMFADisable:
    """Tests para deshabilitar MFA"""
    
    def test_disable_with_valid_code(self, authenticated_client_with_mfa, user_with_mfa):
        """Deshabilitar MFA con código válido debe ser exitoso"""
        # Obtener el dispositivo y generar un código válido
        device = TOTPDevice.objects.filter(user=user_with_mfa, confirmed=True).first()
        valid_token = get_totp_token(device)
        
        # Deshabilitar MFA
        response = authenticated_client_with_mfa.post('/api/auth/mfa/disable/', {
            'token': valid_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['mfa_enabled'] is False
        assert 'MFA deshabilitado exitosamente' in response.data['message']
        
        # Verificar que el dispositivo fue eliminado
        assert not TOTPDevice.objects.filter(user=user_with_mfa).exists()
        
        # Verificar que el usuario tiene MFA deshabilitado
        user_with_mfa.refresh_from_db()
        assert user_with_mfa.mfa_enabled is False
    
    def test_disable_with_invalid_code(self, authenticated_client_with_mfa, user_with_mfa):
        """Deshabilitar MFA con código inválido debe fallar"""
        response = authenticated_client_with_mfa.post('/api/auth/mfa/disable/', {
            'token': '000000'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'inválido' in response.data['error'].lower()
        
        # Verificar que MFA sigue habilitado
        user_with_mfa.refresh_from_db()
        assert user_with_mfa.mfa_enabled is True
    
    def test_disable_when_mfa_not_enabled(self, authenticated_client_no_mfa):
        """Intentar deshabilitar MFA cuando no está habilitado debe fallar"""
        response = authenticated_client_no_mfa.post('/api/auth/mfa/disable/', {
            'token': '123456'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'no está habilitado' in response.data['error'].lower()
    
    def test_disable_unauthenticated(self, api_client):
        """Disable debe rechazar usuarios no autenticados"""
        response = api_client.post('/api/auth/mfa/disable/', {
            'token': '123456'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# Tests de Login con MFA
# ============================================

class TestLoginWithMFA:
    """Tests para login con soporte MFA"""
    
    def test_login_without_mfa_returns_jwt(self, api_client, user_without_mfa):
        """Login de usuario sin MFA debe retornar JWT directamente"""
        response = api_client.post('/api/auth/login/', {
            'username': 'user_no_mfa',
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['mfa_required'] is False
    
    def test_login_with_mfa_requires_verification(self, api_client, user_with_mfa):
        """Login de usuario con MFA debe requerir verificación"""
        response = api_client.post('/api/auth/login/', {
            'username': 'user_mfa',
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['mfa_required'] is True
        assert 'temp_token' in response.data
        assert 'access' not in response.data
        assert 'código de autenticación' in response.data['message'].lower()
    
    def test_login_with_invalid_credentials(self, api_client):
        """Login con credenciales inválidas debe fallar"""
        response = api_client.post('/api/auth/login/', {
            'username': 'invalid_user',
            'password': 'wrong_pass'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'inválidas' in response.data['error'].lower()
    
    def test_verify_login_with_valid_mfa_code(self, api_client, user_with_mfa):
        """Verificar login con código MFA válido debe retornar JWT"""
        # Primer paso: login
        login_response = api_client.post('/api/auth/login/', {
            'username': 'user_mfa',
            'password': 'testpass123'
        })
        
        assert login_response.status_code == status.HTTP_200_OK
        temp_token = login_response.data['temp_token']
        
        # Obtener código válido
        device = TOTPDevice.objects.filter(user=user_with_mfa, confirmed=True).first()
        valid_token = get_totp_token(device)
        
        # Segundo paso: verificar MFA
        verify_response = api_client.post('/api/auth/mfa/verify-login/', {
            'temp_token': temp_token,
            'token': valid_token
        })
        
        assert verify_response.status_code == status.HTTP_200_OK
        assert 'access' in verify_response.data
        assert 'refresh' in verify_response.data
    
    def test_verify_login_with_invalid_mfa_code(self, api_client, user_with_mfa):
        """Verificar login con código MFA inválido debe fallar"""
        # Primer paso: login
        login_response = api_client.post('/api/auth/login/', {
            'username': 'user_mfa',
            'password': 'testpass123'
        })
        
        assert login_response.status_code == status.HTTP_200_OK
        temp_token = login_response.data['temp_token']
        
        # Segundo paso: verificar con código inválido
        verify_response = api_client.post('/api/auth/mfa/verify-login/', {
            'temp_token': temp_token,
            'token': '000000'
        })
        
        assert verify_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'inválido' in verify_response.data['error'].lower()
    
    def test_verify_login_with_expired_temp_token(self, api_client, user_with_mfa):
        """Verificar login con token temporal expirado debe fallar"""
        # Crear un token temporal expirado
        expired_payload = {
            'user_id': user_with_mfa.id,
            'username': user_with_mfa.username,
            'type': 'mfa_temp',
            'exp': datetime.now(timezone.utc) - timedelta(minutes=10)  # Expirado hace 10 minutos
        }
        expired_token = jwt.encode(
            expired_payload,
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        
        # Intentar verificar con token expirado
        response = api_client.post('/api/auth/mfa/verify-login/', {
            'temp_token': expired_token,
            'token': '123456'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'expirado' in response.data['error'].lower()


# ============================================
# Tests de Edge Cases
# ============================================

class TestMFAEdgeCases:
    """Tests para casos especiales y límites"""
    
    def test_cannot_enable_mfa_twice(self, authenticated_client_no_mfa, user_without_mfa):
        """No se debe poder habilitar MFA dos veces seguidas"""
        # Primera habilitación
        setup_response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        device = TOTPDevice.objects.filter(user=user_without_mfa, confirmed=False).first()
        valid_token = get_totp_token(device)
        
        enable_response = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': valid_token
        })
        assert enable_response.status_code == status.HTTP_200_OK
        
        # Intentar habilitar de nuevo sin setup
        second_enable = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': valid_token
        })
        assert second_enable.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_device_is_user_specific(self, authenticated_client_no_mfa, user_without_mfa):
        """Los dispositivos TOTP deben ser específicos del usuario"""
        # Crear otro usuario
        other_user = User.objects.create_user(
            username='other_user',
            password='pass123',
            email='other@example.com'
        )
        other_device = TOTPDevice.objects.create(
            user=other_user,
            name='default',
            confirmed=False
        )
        
        # Intentar habilitar MFA del usuario actual con código del otro usuario
        other_token = get_totp_token(other_device)
        
        setup_response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        enable_response = authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {
            'token': other_token
        })
        
        # Debe fallar porque el código es de otro usuario
        assert enable_response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_mfa_status_reflects_current_state(self, authenticated_client_no_mfa, user_without_mfa):
        """El estado de MFA debe reflejar correctamente los cambios"""
        # Estado inicial: MFA deshabilitado
        status_response = authenticated_client_no_mfa.get('/api/auth/mfa/status/')
        assert status_response.data['mfa_enabled'] is False
        
        # Habilitar MFA
        setup_response = authenticated_client_no_mfa.post('/api/auth/mfa/setup/')
        device = TOTPDevice.objects.filter(user=user_without_mfa, confirmed=False).first()
        valid_token = get_totp_token(device)
        authenticated_client_no_mfa.post('/api/auth/mfa/enable/', {'token': valid_token})
        
        # Estado después de habilitar
        status_response = authenticated_client_no_mfa.get('/api/auth/mfa/status/')
        assert status_response.data['mfa_enabled'] is True
        assert status_response.data['has_device'] is True
