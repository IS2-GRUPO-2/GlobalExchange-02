from .views import MovimientoStockViewset
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'movimiento-stock', MovimientoStockViewset, basename='movimiento_stock')
urlpatterns = router.urls