from rest_framework.routers import DefaultRouter
from .views import DivisaViewset, DenominacionViewset

router = DefaultRouter()
router.register(r'divisas', DivisaViewset, basename='divisa')
router.register(r'denominaciones', DenominacionViewset)
urlpatterns = router.urls
