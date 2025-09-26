from rest_framework.routers import DefaultRouter
from .views import TauserViewSet

router = DefaultRouter()
router.register(r'tauser', TauserViewSet, basename='tauser')

urlpatterns = router.urls
