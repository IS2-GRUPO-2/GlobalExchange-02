from rest_framework import viewsets, permissions, filters
from apps.cotizaciones.models import Tasa
from apps.cotizaciones.serializers import TasaSerializer


class TasaViewSet(viewsets.ModelViewSet):
    queryset = Tasa.objects.select_related("divisa").all()
    serializer_class = TasaSerializer
    permission_classes = [permissions.AllowAny]

    filter_backends = [filters.SearchFilter]
    search_fields = ["divisa__codigo", "divisa__nombre"]

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()