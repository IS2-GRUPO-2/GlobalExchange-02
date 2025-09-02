from rest_framework.routers import DefaultRouter
from .views import PermissionViewSet

router = DefaultRouter()
router.register(r'permisos', PermissionViewSet, basename='permisos')
urlpatterns = router.urls
