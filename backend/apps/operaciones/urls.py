from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    BancoViewSet,
    BilleteraDigitalCatalogoViewSet,
    TarjetaCatalogoViewSet,
    MetodoFinancieroViewSet, 
    MetodoFinancieroDetalleViewSet,
    CuentaBancariaViewSet,
    BilleteraDigitalViewSet,
    TarjetaViewSet,
    ChequeViewSet,
    simular_operacion_privada,
    simular_operacion_publica,
    listar_metodos_disponibles
)
from .views import obtener_tipos_cheque, obtener_divisas_cheque

router = DefaultRouter()
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'billeteras-catalogo', BilleteraDigitalCatalogoViewSet, basename='billeteradigitalcatalogo')
router.register(r'tarjetas-catalogo', TarjetaCatalogoViewSet, basename='tarjetacatalogo')
router.register(r'metodos', MetodoFinancieroViewSet, basename='metodofinanciero')
router.register(r'detalles', MetodoFinancieroDetalleViewSet, basename='metodofinancierodetalle')
router.register(r'cuentas-bancarias', CuentaBancariaViewSet, basename='cuentabancaria')
router.register(r'billeteras-digitales', BilleteraDigitalViewSet, basename='billeteradigital')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')
router.register(r'tarjetas-locales', TarjetaViewSet, basename='tarjetalocal')
router.register(r'cheques', ChequeViewSet, basename='cheque')

urlpatterns = [
    path('', include(router.urls)),
    path("simular_privada/", simular_operacion_privada, name="simular-operacion-privada"),
    path("simular_publica/", simular_operacion_publica, name="simular-operacion-publica"),
    path("metodos-disponibles/", listar_metodos_disponibles, name="metodos-disponibles"),
    path("cheque/tipos/", obtener_tipos_cheque, name="cheque-tipos"),
    path("cheque/divisas/", obtener_divisas_cheque, name="cheque-divisas"),
]
