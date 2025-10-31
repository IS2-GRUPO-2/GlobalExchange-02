import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.facturacion.factura_service import (
    _cargar_datos_pago,
    _cargar_datos_cliente,
    _cargar_datos_iniciales,
    _cargar_item_factura,
)
from apps.usuarios.models import User
from apps.clientes.models import Cliente, CategoriaCliente
from apps.divisas.models import Divisa
from apps.tauser.models import Tauser
from apps.operaciones.models import Transaccion, PagoStripe
from apps.metodos_financieros.models import (
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    Tarjeta,
    Banco,
    Cheque,
)


class FacturaServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="x")

        self.categoria = CategoriaCliente.objects.create(nombre="General")
        self.cliente = Cliente.objects.create(
            nombre="Juan Perez",
            is_persona_fisica=True,
            id_categoria=self.categoria,
            cedula="1234567",
            correo="juan@example.com",
            telefono="555-123",
            direccion="Calle 1",
        )

        self.divisa_base = Divisa.objects.create(codigo="USD", nombre="Dolar", simbolo="$", es_base=True)
        self.divisa_dest = Divisa.objects.create(codigo="PYG", nombre="Guarani", simbolo="G", es_base=False)

        self.tauser = Tauser.objects.create(
            codigo="T001",
            nombre="Tauser Central",
            direccion="Dir",
            ciudad="Asuncion",
            departamento="Central",
            latitud=0,
            longitud=0,
        )

    def _make_transaccion(self, metodo_nombre: str, with_detalle: bool = True) -> Transaccion:
        metodo = MetodoFinanciero.objects.create(nombre=metodo_nombre)
        detalle = None
        if with_detalle:
            detalle = MetodoFinancieroDetalle.objects.create(
                cliente=self.cliente,
                metodo_financiero=metodo,
                alias=f"{metodo_nombre.lower()}-alias",
                es_cuenta_casa=False,
            )

        return Transaccion.objects.create(
            id_user=self.user,
            cliente=self.cliente,
            operacion="compra",
            tasa_aplicada=1,
            tasa_inicial=1,
            divisa_origen=self.divisa_base,
            divisa_destino=self.divisa_dest,
            monto_origen=100,
            monto_destino=700000,
            metodo_financiero=metodo,
            metodo_financiero_detalle=detalle,
            tauser=self.tauser,
            estado="en_proceso",
        )

    def test_cargar_datos_cliente_persona_fisica(self):
        factura = {}
        t = self._make_transaccion("EFECTIVO", with_detalle=False)
        _cargar_datos_cliente(t, factura)
        assert factura["iNatRec"] == "2"
        assert factura["iTiOpe"] == "2"
        assert factura["dNomRec"] == self.cliente.nombre
        assert factura["dEmailRec"] == self.cliente.correo

    def test_cargar_datos_iniciales_basics(self):
        t = self._make_transaccion("EFECTIVO", with_detalle=False)
        factura = _cargar_datos_iniciales(t)
        assert factura["dNumDoc"].startswith("0000")
        assert factura["iTipTra"] == "6"  # compra

    def test_pago_stripe_sets_fields(self):
        t = self._make_transaccion("STRIPE", with_detalle=False)
        PagoStripe.objects.create(transaccion=t, brand="visa", funding="credit")
        factura = {}
        _cargar_datos_pago(t, factura)
        pago = factura["gPaConEIni"][0]
        assert pago["iTiPago"] == "3"  # credit
        assert pago["iDenTarj"] == "1"  # visa
        assert pago["iForProPa"] == "2"
        assert factura["iIndPres"] == "2"

    def test_pago_tarjeta_sets_fields(self):
        t = self._make_transaccion("TARJETA", with_detalle=True)
        Tarjeta.objects.create(
            metodo_financiero_detalle=t.metodo_financiero_detalle,
            tipo="LOCAL",
            payment_method_id="pm_1",
            brand="visa",
            last4="4242",
            exp_month=12,
            exp_year=2030,
            titular="Juan Perez",
        )
        factura = {}
        _cargar_datos_pago(t, factura)
        pago = factura["gPaConEIni"][0]
        assert pago["iTiPago"] == "3"
        assert pago["iDenTarj"] == "1"  # visa
        assert pago["iForProPa"] == "2"
        assert factura["iIndPres"] == "2"

    def test_pago_transferencia_sets_tipo(self):
        t = self._make_transaccion("TRANSFERENCIA_BANCARIA", with_detalle=True)
        factura = {}
        _cargar_datos_pago(t, factura)
        pago = factura["gPaConEIni"][0]
        assert pago["iTiPago"] == "5"
        assert factura["iIndPres"] == "2"

    def test_pago_billetera_sets_tipo(self):
        t = self._make_transaccion("BILLETERA_DIGITAL", with_detalle=True)
        factura = {}
        _cargar_datos_pago(t, factura)
        pago = factura["gPaConEIni"][0]
        assert pago["iTiPago"] == "7"
        assert factura["iIndPres"] == "2"

    def test_pago_cheque_sets_fields_and_padding(self):
        t = self._make_transaccion("CHEQUE", with_detalle=True)
        banco = Banco.objects.create(nombre="Banco X")
        Cheque.objects.create(
            cliente=self.cliente,
            banco_emisor=banco,
            titular="Juan Perez",
            numero="123",
            tipo="NORMAL",
            monto=100,
            divisa="PYG",
            observaciones=f"Transaccion {t.pk}",
            transaccion=t,
        )
        factura = {}
        _cargar_datos_pago(t, factura)
        pago = factura["gPaConEIni"][0]
        assert pago["iTiPago"] == "2"
        assert pago["dNumCheq"] == "00000123"
        assert pago["dBcoEmi"] == "Banco X"
        # Cheque no es online
        assert factura["iIndPres"] == "1"

    def test_cargar_item_factura_sets_item(self):
        t = self._make_transaccion("EFECTIVO", with_detalle=False)
        factura = {}
        _cargar_item_factura(t, factura)
        item = factura["gCamItem"][0]
        assert item["dCodInt"] == self.divisa_dest.codigo
        assert item["cUniMed"] == "77"
