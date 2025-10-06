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
)



router = DefaultRouter()
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'billeteras-catalogo', BilleteraDigitalCatalogoViewSet, basename='billeteradigitalcatalogo')
router.register(r'tarjetas-catalogo', TarjetaCatalogoViewSet, basename='tarjetacatalogo')
router.register(r'metodos', MetodoFinancieroViewSet, basename='metodofinanciero')
router.register(r'detalles', MetodoFinancieroDetalleViewSet, basename='metodofinancierodetalle')
router.register(r'cuentas-bancarias', CuentaBancariaViewSet, basename='cuentabancaria')
router.register(r'billeteras-digitales', BilleteraDigitalViewSet, basename='billeteradigital')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')
router.register(r'cheques', ChequeViewSet, basename='cheque')


urlpatterns = [
    path('', include(router.urls))
]
