from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, CategoriaClienteViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='clientes')
router.register(r'categorias', CategoriaClienteViewSet, basename='categorias-clientes')

urlpatterns = router.urls
