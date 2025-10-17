from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    TransaccionViewSet,
    operacion_publica, 
    operacion_privada, 
    get_op_perspectiva_casa,
    stripe_webhook
)



router = DefaultRouter()
router.register(r'transacciones', TransaccionViewSet, basename='transaccion')

urlpatterns = [
    path('', include(router.urls)),
    path('operacion_privada/', operacion_privada, name='operacion-privada'),
    path('operacion_publica/', operacion_publica, name='operacion-publica'),
    path("op_perspectiva_casa/", get_op_perspectiva_casa, name="op-perspectiva-casa"),
    path('stripe_webhook/', stripe_webhook, name='stripe-webhook')
]
