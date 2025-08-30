from rest_framework.routers import DefaultRouter
from .views import UserViewSet, me_permissions
from django.urls import path

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)

urlpatterns = router.urls
urlpatterns += [
    path("me/permissions/", me_permissions, name="me_permissions"),
]