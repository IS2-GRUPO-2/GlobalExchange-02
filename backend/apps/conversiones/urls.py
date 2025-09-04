from rest_framework.routers import DefaultRouter
from .views import ConversionViewSet

router = DefaultRouter()
router.register(r"", ConversionViewSet, basename="conversiones")

urlpatterns = router.urls
