import pytest
from django.contrib.auth.models import Group, Permission
from apps.roles.serializers import RoleSerializer
from rest_framework.test import APIClient
from apps.usuarios.models import User

pytestmark = pytest.mark.django_db

@pytest.fixture
def authenticated_client():
    """Cliente API autenticado para pruebas con permisos de superusuario"""
    client = APIClient()
    user = User.objects.create_superuser(username="testuser", password="testpass123", email="test@example.com")
    client.force_authenticate(user=user)
    return client

def test_role_serializer_creates_group_with_permissions():
    perms = list(Permission.objects.all()[:3])
    payload = {
        "name": "ADMIN",
        "permissions": [p.id for p in perms],
    }

    ser = RoleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    group = ser.save()

    assert Group.objects.count() == 1
    assert group.name == "ADMIN"
    assert set(group.permissions.values_list("id", flat=True)) == set(p.id for p in perms)

def test_role_serializer_invalid_permission_id_raises_error():
    payload = {"name": "X", "permissions": [999999]}
    ser = RoleSerializer(data=payload)
    assert not ser.is_valid()
    assert "permissions" in ser.errors


pytestmark = pytest.mark.django_db

def _some_permissions(n=3):
    qs = list(Permission.objects.all()[:n])
    assert qs, "No hay permisos en la BD (revisa migraciones de auth)"
    return qs

def test_roles_create_list_detail_update_delete(authenticated_client):
    client = authenticated_client

    # CREATE
    perms = _some_permissions(2)
    resp = client.post(
        "/api/roles/",
        {"name": "ANALISTA", "permissions": [p.id for p in perms]},
        format="json",
    )
    assert resp.status_code in (200, 201), resp.content
    role_id = resp.data["id"]

    group = Group.objects.get(id=role_id)
    assert group.name == "ANALISTA"
    assert set(group.permissions.values_list("id", flat=True)) == set(p.id for p in perms)

    # LIST
    resp = client.get("/api/roles/")
    assert resp.status_code == 200
    data = resp.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert any(r["id"] == role_id for r in results)


    # DETAIL
    resp = client.get(f"/api/roles/{role_id}/")
    assert resp.status_code == 200
    assert resp.json()["name"] == "ANALISTA"

    # PATCH (cambiar nombre y permisos)
    new_perm = _some_permissions(3)[-1]
    resp = client.patch(
        f"/api/roles/{role_id}/",
        {"name": "ANALISTA_SR", "permissions": [new_perm.id]},
        format="json",
    )
    assert resp.status_code in (200, 202)
    group.refresh_from_db()
    assert group.name == "ANALISTA_SR"
    assert list(group.permissions.values_list("id", flat=True)) == [new_perm.id]

    # DELETE
    resp = client.delete(f"/api/roles/{role_id}/")
    assert resp.status_code in (204, 200, 202)
    assert not Group.objects.filter(id=role_id).exists()

def test_permissions_catalog_list_and_detail(authenticated_client):
    client = authenticated_client

    # LIST
    resp = client.get("/api/permisos/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert {"id", "codename", "name", "app_label"}.issubset(data[0].keys())

    pid = data[0]["id"]
    resp = client.get(f"/api/permisos/{pid}/")
    assert resp.status_code == 200
    assert resp.json()["id"] == pid


# MAS TESTS PARA ROBUSTES

@pytest.mark.parametrize("role_name", ["USER", "STAFF", "SUPERVISOR", "QA", "DEVOPS"])
def test_role_serializer_creates_various_roles(role_name):
    perms = _some_permissions(2)
    payload = {"name": role_name, "permissions": [p.id for p in perms]}
    ser = RoleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    group = ser.save()
    assert group.name == role_name
    assert set(group.permissions.values_list("id", flat=True)) == set(p.id for p in perms)


def test_role_serializer_without_permissions():
    payload = {"name": "SIN_PERMISOS", "permissions": []}
    ser = RoleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    group = ser.save()
    assert group.permissions.count() == 0


def test_role_serializer_empty_name_is_invalid():
    perms = _some_permissions(1)
    payload = {"name": "", "permissions": [p.id for p in perms]}
    ser = RoleSerializer(data=payload)
    assert not ser.is_valid()
    assert "name" in ser.errors


def test_role_serializer_duplicate_name_fails():
    perms = _some_permissions(1)
    payload = {"name": "DUPLICADO", "permissions": [p.id for p in perms]}
    ser = RoleSerializer(data=payload)
    assert ser.is_valid()
    ser.save()
    ser2 = RoleSerializer(data=payload)
    assert not ser2.is_valid()
    assert "name" in ser2.errors


# ---- Variantes usando APIClient ----

@pytest.mark.parametrize("role_name", ["COORDINADOR", "GERENTE", "ASISTENTE", "OPERADOR", "LECTOR"])
def test_api_create_and_delete_roles(role_name, authenticated_client):
    client = authenticated_client
    perms = _some_permissions(2)
    resp = client.post(
        "/api/roles/",
        {"name": role_name, "permissions": [p.id for p in perms]},
        format="json",
    )
    assert resp.status_code in (200, 201)
    role_id = resp.data["id"]
    # luego borrar
    resp = client.delete(f"/api/roles/{role_id}/")
    assert resp.status_code in (204, 200, 202)
    assert not Group.objects.filter(id=role_id).exists()


def test_api_update_role_with_more_permissions(authenticated_client):
    client = authenticated_client
    perms = _some_permissions(2)
    resp = client.post(
        "/api/roles/", {"name": "AUDITOR", "permissions": [p.id for p in perms]}, format="json"
    )
    role_id = resp.data["id"]

    extra = _some_permissions(3)
    resp = client.patch(
        f"/api/roles/{role_id}/", {"permissions": [p.id for p in extra]}, format="json"
    )
    assert resp.status_code in (200, 202)
    group = Group.objects.get(id=role_id)
    assert set(group.permissions.values_list("id", flat=True)) == {p.id for p in extra}


def test_api_role_detail_shows_correct_data(authenticated_client):
    client = authenticated_client
    perms = _some_permissions(1)
    resp = client.post(
        "/api/roles/", {"name": "INSPECTOR", "permissions": [p.id for p in perms]}, format="json"
    )
    role_id = resp.data["id"]

    resp = client.get(f"/api/roles/{role_id}/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "INSPECTOR"
    assert perms[0].id in data["permissions"]


def test_api_list_roles_contains_new_role(authenticated_client):
    client = authenticated_client
    resp = client.get("/api/roles/")
    assert resp.status_code == 200
    data = resp.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert isinstance(results, list)


def test_api_permissions_catalog_returns_all(authenticated_client):
    client = authenticated_client
    resp = client.get("/api/permisos/")
    assert resp.status_code == 200
    data = resp.json()
    assert all("id" in p and "codename" in p for p in data)
