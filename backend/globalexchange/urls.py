"""
URL configuration for globalexchange project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from apps.roles.views import RoleViewSet
from apps.usuarios.views import UserViewSet

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

from rest_framework.routers import DefaultRouter



# Configuración de la documentación
schema_view = get_schema_view(
   openapi.Info(
      title="Global Exchange API",
      default_version='v1',
      description="Documentación de API",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="is2-e02@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name="token_refresh"),
    path('api/', include("apps.roles.urls")),
    path('api/', include("apps.permisos.urls")),
    path('api/', include("apps.usuarios.urls")),
    path('api/', include("apps.clientes.urls")),
    path('api/', include("apps.divisas.urls")),
    path("api/auth/", include("apps.autenticacion.urls")),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redocs/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
