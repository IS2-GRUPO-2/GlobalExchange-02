from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    BancoViewSet,
    BilleteraDigitalCatalogoViewSet,
    TarjetaLocalCatalogoViewSet,
    MetodoFinancieroViewSet, 
    MetodoFinancieroDetalleViewSet,
    CuentaBancariaViewSet,
    BilleteraDigitalViewSet,
    TarjetaViewSet,
    TarjetaLocalViewSet,
    ChequeViewSet,
    TransaccionViewSet,
    simular_operacion_privada,
    simular_operacion_privada_con_instancia,
    simular_operacion_publica,
    listar_metodos_disponibles,
    listar_metodos_cliente,
    crear_transaccion_operacion
)
from .views import obtener_tipos_cheque, obtener_divisas_cheque

router = DefaultRouter()
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'billeteras-catalogo', BilleteraDigitalCatalogoViewSet, basename='billeteradigitalcatalogo')
router.register(r'tarjetas-locales-catalogo', TarjetaLocalCatalogoViewSet, basename='tarjetalocalcatalogo')
router.register(r'metodos', MetodoFinancieroViewSet, basename='metodofinanciero')
router.register(r'detalles', MetodoFinancieroDetalleViewSet, basename='metodofinancierodetalle')
router.register(r'cuentas-bancarias', CuentaBancariaViewSet, basename='cuentabancaria')
router.register(r'billeteras-digitales', BilleteraDigitalViewSet, basename='billeteradigital')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')
router.register(r'tarjetas-locales', TarjetaLocalViewSet, basename='tarjetalocal')
router.register(r'cheques', ChequeViewSet, basename='cheque')
router.register(r'transacciones', TransaccionViewSet, basename='transaccion')

urlpatterns = [
    path('', include(router.urls)),
    path("simular_privada/", simular_operacion_privada, name="simular-operacion-privada"),
    path("simular_privada_con_instancia/", simular_operacion_privada_con_instancia, name="simular-operacion-privada-con-instancia"),
    path("simular_publica/", simular_operacion_publica, name="simular-operacion-publica"),
    path("metodos-disponibles/", listar_metodos_disponibles, name="listar-metodos-disponibles"), 
    path("metodos-cliente/", listar_metodos_cliente, name="listar-metodos-cliente"),  
    path("crear-transaccion/", crear_transaccion_operacion, name="crear-transaccion-operacion"),
    path("cheque/tipos/", obtener_tipos_cheque, name="cheque-tipos"),
    path("cheque/divisas/", obtener_divisas_cheque, name="cheque-divisas"),
]
