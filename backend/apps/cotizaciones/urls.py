from rest_framework.routers import DefaultRouter
from apps.cotizaciones.views import TasaViewSet

router = DefaultRouter()
router.register(r"cotizaciones", TasaViewSet, basename="cotizaciones")
urlpatterns = router.urls
