from apps.notificaciones.notification_service import NotificationService
from django.urls import reverse
from django.core import mail
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.divisas.models import Divisa
# ✅ Agregar CategoriaCliente
from apps.clientes.models import Cliente, CategoriaCliente
from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente,
)
from apps.cotizaciones.models import Tasa


@pytest.fixture
def notification_service():
    return NotificationService(from_email="test@correo.com")


def test_send_email(notification_service):
    subject = "Test Subject"
    template_name = "emails/verification_code.html"
    context = {"code": "123456", "user": {"first_name": "Test User"}}
    recipient_list = ["test@correo.com"]

    notification_service.send_email(
        subject, template_name, context, recipient_list)

    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == subject
    assert mail.outbox[0].to == recipient_list


User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente API para hacer requests"""
    return APIClient()


@pytest.fixture
def user_with_token(db):
    """Usuario autenticado con token JWT"""
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        email_verified=True,
        is_active=True
    )

    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)

    return {
        "user": user,
        "token": str(refresh.access_token)
    }


@pytest.fixture
def categoria_cliente(db):
    """Categoría de cliente para testing"""
    return CategoriaCliente.objects.create(
        nombre="Categoría Test",
        descripcion="Categoría para pruebas"
    )


@pytest.fixture
def cliente_with_user(db, user_with_token, categoria_cliente):
    """Cliente asociado a un usuario"""
    cliente = Cliente.objects.create(
        nombre="Cliente Test",
        correo="cliente@test.com",
        telefono="123456789",
        is_active=True,
        id_categoria=categoria_cliente  # ✅ Asignar categoría
    )

    user = user_with_token["user"]
    user.cliente_actual = cliente
    user.save()

    cliente.usuarios.add(user)

    return cliente


@pytest.fixture
def divisas_activas(db):
    """Divisas activas para testing"""
    # Divisa base
    guarani = Divisa.objects.create(
        codigo="PYG",
        nombre="Guaraní",
        simbolo="₲",
        es_base=True,
        is_active=True,
        max_digitos=10,
        precision=0
    )

    # Divisas extranjeras
    usd = Divisa.objects.create(
        codigo="USD",
        nombre="Dólar Estadounidense",
        simbolo="$",
        es_base=False,
        is_active=True,
        max_digitos=10,
        precision=2
    )

    eur = Divisa.objects.create(
        codigo="EUR",
        nombre="Euro",
        simbolo="€",
        es_base=False,
        is_active=True,
        max_digitos=10,
        precision=2
    )

    ars = Divisa.objects.create(
        codigo="ARS",
        nombre="Peso Argentino",
        simbolo="$",
        es_base=False,
        is_active=True,
        max_digitos=10,
        precision=2
    )

    # Crear tasas para las divisas
    Tasa.objects.create(
        divisa=usd,
        precioBase=Decimal("7000.00"),
        comisionBaseCompra=Decimal("50.00"),
        comisionBaseVenta=Decimal("100.00"),
        activo=True
    )

    Tasa.objects.create(
        divisa=eur,
        precioBase=Decimal("8000.00"),
        comisionBaseCompra=Decimal("60.00"),
        comisionBaseVenta=Decimal("120.00"),
        activo=True
    )

    return {
        "guarani": guarani,
        "usd": usd,
        "eur": eur,
        "ars": ars
    }


# ============================================
# TESTS DE NOTIFICACIONES DE TASA DE USUARIO
# ============================================

@pytest.mark.django_db
class TestNotificacionTasaUsuario:
    """Tests para el endpoint de notificaciones de tasa de usuario"""

    def test_obtener_notificaciones_tasa_usuario_sin_autenticar(self, api_client):
        """Debe retornar 401 si no está autenticado"""
        response = api_client.get("/api/notificaciones/tasa/usuario/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_obtener_notificaciones_tasa_usuario_crea_si_no_existe(
        self, api_client, user_with_token
    ):
        """Debe crear notificaciones automáticamente si no existen"""
        token = user_with_token["token"]
        user = user_with_token["user"]

        response = api_client.get(
            "/api/notificaciones/tasa/usuario/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert response.data["divisas_suscritas"] == []

        # Verificar que se creó en BD
        assert NotificacionTasaUsuario.objects.filter(
            usuario=user
        ).exists()

    def test_obtener_notificaciones_tasa_usuario_existentes(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe retornar preferencias existentes"""
        token = user_with_token["token"]
        user = user_with_token["user"]
        usd = divisas_activas["usd"]
        eur = divisas_activas["eur"]

        # Crear notificaciones tasa de usuario manualmente
        pref = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd, eur)

        response = api_client.get(
            "/api/notificaciones/tasa/usuario/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert len(response.data["divisas_suscritas"]) == 2
        assert usd.id in response.data["divisas_suscritas"]
        assert eur.id in response.data["divisas_suscritas"]

    def test_actualizar_notificaciones_tasa_usuario_activar(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe actualizar las preferencias del usuario"""
        token = user_with_token["token"]
        usd = divisas_activas["usd"]
        eur = divisas_activas["eur"]

        data = {
            "is_active": True,
            "divisas_suscritas": [usd.id, eur.id]
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert len(response.data["divisas_suscritas"]) == 2

        # Verificar en BD
        user = user_with_token["user"]
        pref = NotificacionTasaUsuario.objects.get(usuario=user)
        assert pref.is_active is True
        assert pref.divisas_suscritas.count() == 2

    def test_actualizar_notificaciones_tasa_usuario_desactivar(
        self, api_client, user_with_token
    ):
        """Debe poder desactivar notificaciones"""
        token = user_with_token["token"]

        data = {
            "is_active": False,
            "divisas_suscritas": []
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False
        assert response.data["divisas_suscritas"] == []

    def test_actualizar_notificaciones_tasa_con_divisa_invalida(
        self, api_client, user_with_token
    ):
        """Debe rechazar divisas inválidas"""
        token = user_with_token["token"]

        data = {
            "is_active": True,
            "divisas_suscritas": [9999]  # ID inexistente
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_actualizar_notificaciones_tasa_parcialmente_patch(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe permitir actualización parcial con PATCH"""
        token = user_with_token["token"]
        user = user_with_token["user"]
        usd = divisas_activas["usd"]

        # Crear notificaciones de tasa iniciales del usuario
        pref = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Actualizar solo notificaciones activas
        data = {
            "is_active": False
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False
        # Las divisas deben mantenerse
        assert usd.id in response.data["divisas_suscritas"]

    def test_divisas_detalle_en_respuesta(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe incluir detalles de divisas en la respuesta"""
        token = user_with_token["token"]
        user = user_with_token["user"]
        usd = divisas_activas["usd"]

        pref = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        response = api_client.get(
            "/api/notificaciones/tasa/usuario/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "divisas_detalle" in response.data
        assert len(response.data["divisas_detalle"]) == 1

        divisa_detalle = response.data["divisas_detalle"][0]
        assert divisa_detalle["codigo"] == "USD"
        assert divisa_detalle["nombre"] == "Dólar Estadounidense"
        assert divisa_detalle["simbolo"] == "$"


# ============================================
# TESTS DE NOTIFICACIONES DE TASA DE CLIENTE
# ============================================

@pytest.mark.django_db
class TestNotificacionTasaCliente:
    """Tests para el endpoint de notificaciones de tasa de cliente"""

    def test_obtener_notificaciones_tasa_sin_cliente_actual(
        self, api_client, user_with_token
    ):
        """Debe retornar error si no hay cliente actual"""
        token = user_with_token["token"]

        response = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "cliente seleccionado" in response.data["error"].lower()

    def test_obtener_notificaciones_tasa_cliente_crea_si_no_existe(
        self, api_client, user_with_token, cliente_with_user
    ):
        """Debe crear notificaciones tasa del cliente si no existen"""
        token = user_with_token["token"]

        response = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert response.data["cliente_nombre"] == "Cliente Test"
        assert response.data["divisas_suscritas"] == []

        # Verificar creación en BD
        assert NotificacionTasaCliente.objects.filter(
            cliente=cliente_with_user
        ).exists()

    def test_obtener_notificaciones_tasa_cliente_existentes(
        self, api_client, user_with_token, cliente_with_user, divisas_activas
    ):
        """Debe retornar preferencias existentes del cliente"""
        token = user_with_token["token"]
        usd = divisas_activas["usd"]

        pref = NotificacionTasaCliente.objects.create(
            cliente=cliente_with_user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        response = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert len(response.data["divisas_suscritas"]) == 1
        assert usd.id in response.data["divisas_suscritas"]

    def test_actualizar_notificaciones_tasa_cliente(
        self, api_client, user_with_token, cliente_with_user, divisas_activas
    ):
        """Debe actualizar las notificaciones tasa del cliente"""
        token = user_with_token["token"]
        usd = divisas_activas["usd"]
        eur = divisas_activas["eur"]

        data = {
            "is_active": True,
            "divisas_suscritas": [usd.id, eur.id]
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/cliente/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        assert len(response.data["divisas_suscritas"]) == 2

        # Verificar en BD
        pref = NotificacionTasaCliente.objects.get(
            cliente=cliente_with_user
        )
        assert pref.is_active is True
        assert pref.divisas_suscritas.count() == 2

    def test_actualizar_notificaciones_tasa_cliente_sin_cliente_actual(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe rechazar actualización si no hay cliente actual"""
        token = user_with_token["token"]
        usd = divisas_activas["usd"]

        data = {
            "is_active": True,
            "divisas_suscritas": [usd.id]
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/cliente/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "cliente seleccionado" in response.data["error"].lower()

    def test_multiples_usuarios_mismo_cliente(
        self, api_client, cliente_with_user, divisas_activas
    ):
        """Múltiples usuarios deben poder acceder a notificaciones tasa del mismo cliente"""
        usd = divisas_activas["usd"]

        # Usuario 1 configura notificaciones tasa
        user1 = User.objects.create_user(
            username="user1",
            email="user1@test.com",
            password="pass123",
            email_verified=True,
            cliente_actual=cliente_with_user
        )
        cliente_with_user.usuarios.add(user1)

        from rest_framework_simplejwt.tokens import RefreshToken
        token1 = str(RefreshToken.for_user(user1).access_token)

        data = {
            "is_active": True,
            "divisas_suscritas": [usd.id]
        }

        response1 = api_client.patch(
            "/api/notificaciones/tasa/cliente/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token1}"
        )

        assert response1.status_code == status.HTTP_200_OK

        # Usuario 2 accede a las mismas notificaciones tasa
        user2 = User.objects.create_user(
            username="user2",
            email="user2@test.com",
            password="pass123",
            email_verified=True,
            cliente_actual=cliente_with_user
        )
        cliente_with_user.usuarios.add(user2)

        token2 = str(RefreshToken.for_user(user2).access_token)

        response2 = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token2}"
        )

        assert response2.status_code == status.HTTP_200_OK
        assert response2.data["is_active"] is True
        assert usd.id in response2.data["divisas_suscritas"]

    def test_cliente_nombre_en_respuesta(
        self, api_client, user_with_token, cliente_with_user
    ):
        """Debe incluir el nombre del cliente en la respuesta"""
        token = user_with_token["token"]

        response = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["cliente_nombre"] == "Cliente Test"

    def test_divisas_detalle_cliente(
        self, api_client, user_with_token, cliente_with_user, divisas_activas
    ):
        """Debe incluir detalles de divisas del cliente"""
        token = user_with_token["token"]
        usd = divisas_activas["usd"]
        eur = divisas_activas["eur"]

        pref = NotificacionTasaCliente.objects.create(
            cliente=cliente_with_user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd, eur)

        response = api_client.get(
            "/api/notificaciones/tasa/cliente/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "divisas_detalle" in response.data
        assert len(response.data["divisas_detalle"]) == 2

        codigos = [d["codigo"] for d in response.data["divisas_detalle"]]
        assert "USD" in codigos
        assert "EUR" in codigos


# ============================================
# TESTS DE INTEGRACIÓN
# ============================================

@pytest.mark.django_db
class TestIntegracionNotificaciones:
    """Tests de integración con el sistema de notificaciones"""

    def test_filtrado_notificaciones_tasa_por_usuario(
        self, user_with_token, divisas_activas
    ):
        """Debe filtrar notificaciones según preferencias del usuario"""
        user = user_with_token["user"]
        usd = divisas_activas["usd"]
        eur = divisas_activas["eur"]

        # Usuario suscrito solo a USD
        pref = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Filtrar usuarios suscritos a USD
        usuarios_usd = NotificacionTasaUsuario.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            usuario__is_active=True,
            usuario__email_verified=True
        )

        assert usuarios_usd.count() == 1
        assert usuarios_usd.first().usuario == user

        # Filtrar usuarios suscritos a EUR (debe estar vacío)
        usuarios_eur = NotificacionTasaUsuario.objects.filter(
            is_active=True,
            divisas_suscritas=eur,
            usuario__is_active=True,
            usuario__email_verified=True
        )

        assert usuarios_eur.count() == 0

    def test_filtrado_notificaciones_tasa_por_cliente(
        self, user_with_token, cliente_with_user, divisas_activas
    ):
        """Debe filtrar notificaciones según preferencias del cliente"""
        usd = divisas_activas["usd"]

        # Cliente suscrito a USD
        pref = NotificacionTasaCliente.objects.create(
            cliente=cliente_with_user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Filtrar clientes suscritos a USD
        clientes_usd = NotificacionTasaCliente.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            cliente__is_active=True
        ).prefetch_related("cliente__usuarios")

        assert clientes_usd.count() == 1

        # Obtener usuarios del cliente
        usuarios_notificar = clientes_usd.first().cliente.usuarios.filter(
            is_active=True,
            email_verified=True
        )

        assert usuarios_notificar.count() == 1
        assert user_with_token["user"] in usuarios_notificar

    def test_usuario_y_cliente_suscritos_no_duplica_emails(
        self, user_with_token, cliente_with_user, divisas_activas
    ):
        """No debe duplicar emails si usuario y cliente están suscritos"""
        user = user_with_token["user"]
        usd = divisas_activas["usd"]

        # Usuario suscrito a USD
        pref_user = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref_user.divisas_suscritas.add(usd)

        # Cliente suscrito a USD
        pref_cliente = NotificacionTasaCliente.objects.create(
            cliente=cliente_with_user,
            is_active=True
        )
        pref_cliente.divisas_suscritas.add(usd)

        # Simular recolección de emails (como en _notificar_cambio_tasa)
        recipient_list = set()

        # Emails de usuarios
        prefs_usuarios = NotificacionTasaUsuario.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            usuario__is_active=True,
            usuario__email_verified=True
        )

        for pref in prefs_usuarios:
            recipient_list.add(pref.usuario.email)

        # Emails de clientes
        prefs_clientes = NotificacionTasaCliente.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            cliente__is_active=True
        )

        for pref in prefs_clientes:
            for usuario in pref.cliente.usuarios.filter(
                is_active=True, email_verified=True
            ):
                recipient_list.add(usuario.email)

        # El email debe aparecer solo una vez (set elimina duplicados)
        assert len(recipient_list) == 1
        assert user.email in recipient_list


# ============================================
# TESTS DE EDGE CASES
# ============================================

@pytest.mark.django_db
class TestEdgeCases:
    """Tests de casos extremos y límites"""

    def test_actualizar_con_array_vacio_divisas(
        self, api_client, user_with_token, divisas_activas
    ):
        """Debe permitir vaciar divisas suscritas"""
        token = user_with_token["token"]
        user = user_with_token["user"]
        usd = divisas_activas["usd"]

        # Crear con divisas
        pref = NotificacionTasaUsuario.objects.create(
            usuario=user,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Vaciar divisas
        data = {
            "is_active": True,
            "divisas_suscritas": []
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["divisas_suscritas"] == []

        pref.refresh_from_db()
        assert pref.divisas_suscritas.count() == 0

    def test_usuario_inactivo_no_recibe_notificaciones(
        self, divisas_activas
    ):
        """Usuarios inactivos no deben recibir notificaciones"""
        user_inactivo = User.objects.create_user(
            username="inactivo",
            email="inactivo@test.com",
            password="pass123",
            email_verified=True,
            is_active=False  # ❌ Inactivo
        )

        usd = divisas_activas["usd"]

        pref = NotificacionTasaUsuario.objects.create(
            usuario=user_inactivo,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Filtrar usuarios activos
        usuarios = NotificacionTasaUsuario.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            usuario__is_active=True,  # ✅ Solo activos
            usuario__email_verified=True
        )

        assert usuarios.count() == 0

    def test_cliente_inactivo_no_recibe_notificaciones(
        self, user_with_token, divisas_activas, categoria_cliente
    ):
        """Clientes inactivos no deben recibir notificaciones"""
        user = user_with_token["user"]
        usd = divisas_activas["usd"]

        cliente_inactivo = Cliente.objects.create(
            nombre="Cliente Inactivo",
            correo="inactivo@cliente.com",
            is_active=False,  # ❌ Inactivo
            id_categoria=categoria_cliente  # ✅ Asignar categoría
        )

        pref = NotificacionTasaCliente.objects.create(
            cliente=cliente_inactivo,
            is_active=True
        )
        pref.divisas_suscritas.add(usd)

        # Filtrar clientes activos
        clientes = NotificacionTasaCliente.objects.filter(
            is_active=True,
            divisas_suscritas=usd,
            cliente__is_active=True  # ✅ Solo activos
        )

        assert clientes.count() == 0

    def test_divisa_inactiva_no_permite_suscripcion(
        self, api_client, user_with_token
    ):
        """No debe permitir suscribirse a divisas inactivas"""
        token = user_with_token["token"]

        # Divisa inactiva
        divisa_inactiva = Divisa.objects.create(
            codigo="GBP",
            nombre="Libra Esterlina",
            simbolo="£",
            is_active=False,  # ❌ Inactiva
            max_digitos=10,
            precision=2
        )

        data = {
            "is_active": True,
            "divisas_suscritas": [divisa_inactiva.id]
        }

        response = api_client.patch(
            "/api/notificaciones/tasa/usuario/",
            data=data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
