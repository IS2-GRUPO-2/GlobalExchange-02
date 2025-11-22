# tests/test_cotizaciones.py
import pytest
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse, NoReverseMatch, get_resolver
from django.utils import timezone
from rest_framework.test import APIClient

from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa, HistorialTasa
from apps.cotizaciones.serializers import TasaSerializer
from apps.cotizaciones.service import TasaService

User = get_user_model()

# =========================
# URL helpers (dinámicos)
# =========================

def _all_named_urls():
    names = []
    for k in get_resolver().reverse_dict.keys():
        if isinstance(k, str):
            names.append(k)
    return names

def _find_url_name(required_keywords, fallback_keywords=None):
    names = _all_named_urls()
    def pick(need):
        cand = [n for n in names if all(kw in n for kw in need)]
        if cand:
            return sorted(cand, key=len)[0]
        return None

    name = pick(required_keywords)
    if not name and fallback_keywords:
        name = pick(fallback_keywords)
    if not name:
        raise NoReverseMatch(
            f"No se encontró un nombre de URL que matchee {required_keywords} "
            f"(alternativa {fallback_keywords}). Disponibles: {names}"
        )
    return name

def url_list():
    # Prioriza 'cotizaciones-list' que tenés registrado
    try:
        name = _find_url_name(["cotizaciones", "-list"])
    except NoReverseMatch:
        # Fallbacks por si cambia el basename
        try:
            name = _find_url_name(["tasa", "-list"])
        except NoReverseMatch:
            name = _find_url_name(["tasas", "-list"])
    return reverse(name)

def url_detail(pk: int):
    # Prioriza 'cotizaciones-detail'
    try:
        name = _find_url_name(["cotizaciones", "-detail"])
    except NoReverseMatch:
        try:
            name = _find_url_name(["tasa", "-detail"])
        except NoReverseMatch:
            name = _find_url_name(["tasas", "-detail"])
    return reverse(name, kwargs={"pk": pk})

def url_public():
    # Tenés 'cotizaciones-public-rates'
    try:
        name = _find_url_name(["cotizaciones", "public", "rates"])
    except NoReverseMatch:
        # Fallbacks por si cambia el url_name
        try:
            name = _find_url_name(["tasa", "public", "rates"])
        except NoReverseMatch:
            try:
                name = _find_url_name(["tasas", "public", "rates"])
            except NoReverseMatch:
                try:
                    name = _find_url_name(["cotizaciones", "public"])
                except NoReverseMatch:
                    try:
                        name = _find_url_name(["tasa", "public"])
                    except NoReverseMatch:
                        name = _find_url_name(["tasas", "public"])
    return reverse(name)


def url_public_history():
    try:
        name = _find_url_name(["cotizaciones", "public", "history"])
    except NoReverseMatch:
        try:
            name = _find_url_name(["tasa", "public", "history"])
        except NoReverseMatch:
            name = _find_url_name(["tasas", "public", "history"])
    return reverse(name)

# =========================
# Helpers permisos
# =========================

def make_user_with_perms(*codenames):
    user = User.objects.create_user(username="tester", password="1234")
    perms = Permission.objects.filter(codename__in=codenames)
    user.user_permissions.add(*perms)
    return user

# =========================
# Fixtures
# =========================

@pytest.fixture
def api():
    return APIClient()

@pytest.fixture
def base_divisa():
    return Divisa.objects.create(
        codigo="PYG", nombre="Guaraní", simbolo="₲",
        is_active=True, es_base=True
    )

@pytest.fixture
def usd_divisa():
    return Divisa.objects.create(
        codigo="USD", nombre="Dólar estadounidense", simbolo="$",
        is_active=True, es_base=False
    )

@pytest.fixture
def eur_divisa():
    return Divisa.objects.create(
        codigo="EUR", nombre="Euro", simbolo="€",
        is_active=True, es_base=False
    )

# =========================
# Service tests
# =========================

@pytest.mark.django_db
def test_service_calcular_compra_y_venta(usd_divisa):
    t = Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7300.0000000000"),
        comisionBaseCompra=Decimal("100.0000000000"),
        comisionBaseVenta=Decimal("150.0000000000"),
        activo=True,
    )
    compra = TasaService.calcular_tasa_compra(t)
    venta = TasaService.calcular_tasa_venta(t)
    assert compra == Decimal("7200.0000000000")
    assert venta == Decimal("7450.0000000000")

@pytest.mark.django_db
def test_service_crear_historial(usd_divisa):
    t = Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("50"),
        comisionBaseVenta=Decimal("50"),
        activo=True,
    )
    h = TasaService.crear_historial(t)
    assert HistorialTasa.objects.count() == 1
    assert h.tasa_id == t.id
    assert h.tasaCompra == Decimal("6950")
    assert h.tasaVenta == Decimal("7050")

# =========================
# Serializer tests
# =========================

@pytest.mark.django_db
def test_serializer_campos_calculados_y_create_crea_historial(usd_divisa):
    data = {
        "divisa": usd_divisa.id,
        "precioBase": "7300",
        "comisionBaseCompra": "100",
        "comisionBaseVenta": "150",
        "activo": True,
    }
    serializer = TasaSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    tasa = serializer.save()
    rep = TasaSerializer(instance=tasa).data

    # Comparar numéricamente
    assert Decimal(rep["tasaCompra"]) == Decimal("7200")
    assert Decimal(rep["tasaVenta"]) == Decimal("7450")

    # Se crea historial automáticamente
    assert HistorialTasa.objects.filter(tasa=tasa).count() == 1

@pytest.mark.django_db
def test_serializer_validate_divisa_duplicada(usd_divisa):
    Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("10"),
        comisionBaseVenta=Decimal("10"),
        activo=True,
    )
    serializer = TasaSerializer(data={
        "divisa": usd_divisa.id,
        "precioBase": "7100",
        "comisionBaseCompra": "5",
        "comisionBaseVenta": "5",
        "activo": True,
    })
    assert not serializer.is_valid()
    # OneToOneField dispara UniqueValidator en el campo 'divisa'
    assert "divisa" in serializer.errors
    codes = [getattr(e, "code", "") for e in serializer.errors["divisa"]]
    assert "unique" in codes

@pytest.mark.django_db
def test_serializer_validate_no_cambiar_divisa_en_update(usd_divisa, eur_divisa):
    t = Tasa.objects.create(
        divisa=usd_divisa, precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("0"), comisionBaseVenta=Decimal("0"),
        activo=True,
    )
    serializer = TasaSerializer(instance=t, data={
        "divisa": eur_divisa.id,
        "precioBase": "7000",
        "comisionBaseCompra": "0",
        "comisionBaseVenta": "0",
        "activo": True,
    }, partial=True)
    assert not serializer.is_valid()
    assert "No se puede cambiar la divisa" in str(serializer.errors)

@pytest.mark.django_db
def test_serializer_validate_no_activar_si_divisa_inactiva():
    divisa_inactiva = Divisa.objects.create(
        codigo="CLP", nombre="Peso chileno", simbolo="$",
        is_active=False, es_base=False
    )
    serializer = TasaSerializer(data={
        "divisa": divisa_inactiva.id,
        "precioBase": "1",
        "comisionBaseCompra": "0",
        "comisionBaseVenta": "0",
        "activo": True,
    })
    assert not serializer.is_valid()
    assert "No se puede activar una Cotización" in str(serializer.errors)

@pytest.mark.django_db
def test_serializer_update_crea_historial_si_cambian_valores(usd_divisa):
    t = Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("10"),
        comisionBaseVenta=Decimal("10"),
        activo=True,
    )
    assert HistorialTasa.objects.count() == 0

    serializer = TasaSerializer(instance=t, data={
        "precioBase": "7100",
        "comisionBaseCompra": "10",
        "comisionBaseVenta": "10",
    }, partial=True)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    assert HistorialTasa.objects.filter(tasa=t).count() == 1

@pytest.mark.django_db
def test_serializer_update_no_crea_historial_si_solo_activo(usd_divisa):
    t = Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("10"),
        comisionBaseVenta=Decimal("10"),
        activo=True,
    )
    serializer = TasaSerializer(instance=t, data={"activo": False}, partial=True)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    assert HistorialTasa.objects.filter(tasa=t).count() == 0
    t.refresh_from_db()
    assert t.activo is False

# =========================
# Endpoints (ViewSet)
# =========================

@pytest.mark.django_db
def test_public_rates_endpoint(api, base_divisa, usd_divisa, eur_divisa):
    Tasa.objects.create(
        divisa=usd_divisa, precioBase=Decimal("7300"),
        comisionBaseCompra=Decimal("100"), comisionBaseVenta=Decimal("150"),
        activo=True,
    )
    Tasa.objects.create(
        divisa=eur_divisa, precioBase=Decimal("8000"),
        comisionBaseCompra=Decimal("200"), comisionBaseVenta=Decimal("300"),
        activo=True,
    )

    url = url_public()
    resp = api.get(url)
    assert resp.status_code == 200
    data = resp.json()

    # Debe traer USD y EUR
    codigos = {d["codigo"] for d in data}
    assert {"USD", "EUR"}.issubset(codigos)

    # Símbolo = símbolo de la divisa base
    for d in data:
        assert d["simbolo"] == base_divisa.simbolo

    # Flags esperadas
    flags = {item["codigo"]: item["flag"] for item in data}
    assert flags["USD"] == "🇺🇸"
    assert flags["EUR"] == "🇪🇺"

    # Valores calculados
    mapa = {item["codigo"]: item for item in data}
    assert Decimal(mapa["USD"]["compra"]) == Decimal("7200")
    assert Decimal(mapa["USD"]["venta"]) == Decimal("7450")
    assert Decimal(mapa["EUR"]["compra"]) == Decimal("7800")
    assert Decimal(mapa["EUR"]["venta"]) == Decimal("8300")


# =========================
# Historial público
# =========================


@pytest.mark.django_db
def test_public_history_requires_divisa_param(api, base_divisa):
    resp = api.get(url_public_history())
    assert resp.status_code == 400
    assert "divisa" in resp.data["detail"]


@pytest.mark.django_db
def test_public_history_filters_by_range(api, base_divisa, usd_divisa):
    tasa = Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("50"),
        comisionBaseVenta=Decimal("80"),
        activo=True,
    )
    old_point = HistorialTasa.objects.create(
        tasa=tasa,
        tasaCompra=Decimal("6950"),
        tasaVenta=Decimal("7080"),
    )
    new_point = HistorialTasa.objects.create(
        tasa=tasa,
        tasaCompra=Decimal("6900"),
        tasaVenta=Decimal("7120"),
    )
    old_point.fechaCreacion = timezone.now() - timedelta(days=10)
    old_point.save(update_fields=["fechaCreacion"])
    new_point.fechaCreacion = timezone.now() - timedelta(days=2)
    new_point.save(update_fields=["fechaCreacion"])

    start = (timezone.now() - timedelta(days=3)).date().isoformat()
    end = timezone.now().date().isoformat()

    resp = api.get(
        url_public_history(),
        {"divisa": "USD", "start": start, "end": end},
    )

    assert resp.status_code == 200
    assert resp.data["divisa"]["codigo"] == "USD"
    assert len(resp.data["points"]) == 1
    assert Decimal(resp.data["points"][0]["tasaVenta"]) == new_point.tasaVenta


@pytest.mark.django_db
def test_public_history_validates_dates(api, base_divisa, usd_divisa):
    Tasa.objects.create(
        divisa=usd_divisa,
        precioBase=Decimal("7000"),
        comisionBaseCompra=Decimal("50"),
        comisionBaseVenta=Decimal("80"),
        activo=True,
    )

    resp = api.get(
        url_public_history(),
        {"divisa": "USD", "start": "2024-99-01"},
    )
    assert resp.status_code == 400
    assert "formato" in resp.data["detail"].lower()

    resp = api.get(
        url_public_history(),
        {"divisa": "USD", "start": "2024-01-10", "end": "2024-01-01"},
    )
    assert resp.status_code == 400
    assert "inicial" in resp.data["detail"]

@pytest.mark.django_db
def test_list_endpoint_requiere_permiso(api, usd_divisa):
    url = url_list()
    resp = api.get(url)
    assert resp.status_code in (401, 403)

@pytest.mark.django_db
def test_crud_flow_con_permisos(api, usd_divisa):
    user = make_user_with_perms("view_tasa", "add_tasa", "change_tasa", "delete_tasa")
    api.force_authenticate(user=user)

    # CREATE
    payload = {
        "divisa": usd_divisa.id,
        "precioBase": "7300.0000000000",
        "comisionBaseCompra": "100.0000000000",
        "comisionBaseVenta": "150.0000000000",
        "activo": True,
    }
    create_resp = api.post(url_list(), payload, format="json")
    assert create_resp.status_code in (201, 200)
    tasa_id = create_resp.data["id"]
    assert HistorialTasa.objects.filter(tasa_id=tasa_id).count() == 1  # creado por serializer.create

    # RETRIEVE
    get_resp = api.get(url_detail(tasa_id))
    assert get_resp.status_code == 200
    assert get_resp.data["divisa"] == usd_divisa.id
    assert Decimal(get_resp.data["tasaCompra"]) == Decimal("7200")
    assert Decimal(get_resp.data["tasaVenta"]) == Decimal("7450")

    # UPDATE (cambia precioBase => nuevo historial)
    patch_resp = api.patch(url_detail(tasa_id), {"precioBase": "7400"}, format="json")
    assert patch_resp.status_code in (200, 202)
    assert HistorialTasa.objects.filter(tasa_id=tasa_id).count() == 2

    # DELETE lógico (perform_destroy => activo=False)
    delete_resp = api.delete(url_detail(tasa_id))
    assert delete_resp.status_code in (204, 200, 202)
    t = Tasa.objects.get(pk=tasa_id)
    assert t.activo is False
    assert Tasa.objects.filter(pk=tasa_id).exists()
