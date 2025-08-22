import pytest
from django.contrib.auth.models import Group, Permission
from apps.roles.serializers import RoleSerializer
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

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

def test_roles_create_list_detail_update_delete():
    client = APIClient()

    # CREATE
    perms = _some_permissions(2)
    resp = client.post(
        "/roles/",
        {"name": "ANALISTA", "permissions": [p.id for p in perms]},
        format="json",
    )
    assert resp.status_code in (200, 201), resp.content
    role_id = resp.data["id"]

    group = Group.objects.get(id=role_id)
    assert group.name == "ANALISTA"
    assert set(group.permissions.values_list("id", flat=True)) == set(p.id for p in perms)

    # LIST
    resp = client.get("/roles/")
    assert resp.status_code == 200
    assert any(r["id"] == role_id for r in resp.json())

    # DETAIL
    resp = client.get(f"/roles/{role_id}/")
    assert resp.status_code == 200
    assert resp.json()["name"] == "ANALISTA"

    # PATCH (cambiar nombre y permisos)
    new_perm = _some_permissions(3)[-1]
    resp = client.patch(
        f"/roles/{role_id}/",
        {"name": "ANALISTA_SR", "permissions": [new_perm.id]},
        format="json",
    )
    assert resp.status_code in (200, 202)
    group.refresh_from_db()
    assert group.name == "ANALISTA_SR"
    assert list(group.permissions.values_list("id", flat=True)) == [new_perm.id]

    # DELETE
    resp = client.delete(f"/roles/{role_id}/")
    assert resp.status_code in (204, 200, 202)
    assert not Group.objects.filter(id=role_id).exists()

def test_permissions_catalog_list_and_detail():
    client = APIClient()

    # LIST
    resp = client.get("/permisos/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert {"id", "codename", "name", "app_label"}.issubset(data[0].keys())

    pid = data[0]["id"]
    resp = client.get(f"/permisos/{pid}/")
    assert resp.status_code == 200
    assert resp.json()["id"] == pid
