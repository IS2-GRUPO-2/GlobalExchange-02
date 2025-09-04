from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    MetodoFinancieroViewSet, 
    MetodoFinancieroDetalleViewSet,
    CuentaBancariaViewSet,
    BilleteraDigitalViewSet,
    TarjetaViewSet
)

router = DefaultRouter()
router.register(r'metodos', MetodoFinancieroViewSet, basename='metodofinanciero')
router.register(r'detalles', MetodoFinancieroDetalleViewSet, basename='metodofinancierodetalle')
router.register(r'cuentas-bancarias', CuentaBancariaViewSet, basename='cuentabancaria')
router.register(r'billeteras-digitales', BilleteraDigitalViewSet, basename='billeteradigital')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')

urlpatterns = [
    path('', include(router.urls)),
]
