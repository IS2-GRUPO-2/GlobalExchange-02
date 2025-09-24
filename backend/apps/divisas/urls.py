from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DivisaViewset, DenominacionViewset, LimiteConfigView

router = DefaultRouter()
router.register(r'divisas', DivisaViewset, basename='divisa')
router.register(r'denominaciones', DenominacionViewset)
urlpatterns = [
    path('', include(router.urls)),
    path('limite-config/', LimiteConfigView.as_view(), name='limite-config'),
]