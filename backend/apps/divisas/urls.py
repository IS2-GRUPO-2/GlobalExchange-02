from rest_framework.routers import DefaultRouter
from .views import DivisaViewset, DenominacionViewset, LimiteDivisaViewset

router = DefaultRouter()
router.register(r'divisas', DivisaViewset, basename='divisa')
router.register(r'denominaciones', DenominacionViewset)
router.register(r'limite_divisa', LimiteDivisaViewset)
urlpatterns = router.urls
